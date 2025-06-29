/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // 创建事务函数以同时创建用户资料和组织成员关系
    pgm.createFunction(
        'create_user_profile_with_memberships',
        [
            { name: 'p_id', type: 'uuid' },
            { name: 'p_username', type: 'text' },
            { name: 'p_note', type: 'text' },
            { name: 'p_role', type: 'text' },
            { name: 'p_status', type: 'text' },
            { name: 'p_organization_ids', type: 'uuid[]' }
        ],
        { returns: 'void', language: 'plpgsql' },
        `
        DECLARE
            org_id uuid;
        BEGIN
            -- 事务开始
            -- 插入用户资料
            INSERT INTO public.user_profiles (id, username, note, role, status)
            VALUES (p_id, p_username, p_note, p_role, p_status);

            -- 如果有组织ID，则创建组织成员关系
            IF array_length(p_organization_ids, 1) > 0 THEN
                FOREACH org_id IN ARRAY p_organization_ids
                LOOP
                    INSERT INTO public.user_organization_memberships
                        (user_id, organization_id, role_in_org, status_in_org)
                    VALUES
                        (p_id, org_id, 'member', 'pending_approval');
                END LOOP;
            END IF;
        END;
        `
    );

    // 创建缓存刷新触发器，当用户资料更新时使缓存失效
    pgm.createFunction(
        'invalidate_user_cache',
        [],
        { returns: 'trigger', language: 'plpgsql' },
        `
        BEGIN
            -- 当用户资料被更新时，系统会发送通知
            -- 此通知可以被缓存系统监听以清理相关缓存
            PERFORM pg_notify('user_cache_invalidation', NEW.id::text);
            RETURN NEW;
        END;
        `
    );

    // 为user_profiles表添加触发器
    pgm.createTrigger('user_profiles', 'invalidate_cache_trigger', {
        when: 'AFTER',
        operation: 'UPDATE',
        level: 'ROW',
        function: 'invalidate_user_cache'
    });

    // 创建批量获取用户信息函数，减少多次请求
    pgm.createFunction(
        'get_users_with_details',
        [
            { name: 'p_user_ids', type: 'uuid[]' }
        ],
        { returns: 'json', language: 'plpgsql' },
        `
        DECLARE
            result json;
        BEGIN
            SELECT json_agg(
                json_build_object(
                    'id', u.id,
                    'username', u.username,
                    'role', u.role,
                    'status', u.status,
                    'created_at', u.created_at,
                    'organizations', (
                        SELECT json_agg(
                            json_build_object(
                                'org_id', o.id,
                                'name', o.name,
                                'role_in_org', uom.role_in_org,
                                'status_in_org', uom.status_in_org
                            )
                        )
                        FROM user_organization_memberships uom
                        JOIN organizations o ON uom.organization_id = o.id
                        WHERE uom.user_id = u.id
                    )
                )
            ) INTO result
            FROM user_profiles u
            WHERE u.id = ANY(p_user_ids);

            RETURN result;
        END;
        `
    );
};

exports.down = pgm => {
    // 移除触发器
    pgm.dropTrigger('user_profiles', 'invalidate_cache_trigger', { ifExists: true });

    // 移除函数
    pgm.dropFunction('invalidate_user_cache', [], { ifExists: true });
    pgm.dropFunction('create_user_profile_with_memberships', [
        'uuid', 'text', 'text', 'text', 'text', 'uuid[]'
    ], { ifExists: true });
    pgm.dropFunction('get_users_with_details', ['uuid[]'], { ifExists: true });
};