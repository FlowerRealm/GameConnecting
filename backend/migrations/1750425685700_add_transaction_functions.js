/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // 创建缓存刷新触发器
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
};

exports.down = pgm => {
    // 移除触发器
    pgm.dropTrigger('user_profiles', 'invalidate_cache_trigger', { ifExists: true });

    // 移除函数
    pgm.dropFunction('invalidate_user_cache', [], { ifExists: true });
};