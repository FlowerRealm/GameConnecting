/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // 创建密码重置请求表
    pgm.createTable('password_reset_requests', {
        id: {
            type: 'uuid',
            primaryKey: true,
            notNull: true
        },
        user_id: {
            type: 'uuid',
            notNull: true,
            references: '"user_profiles"',
            onDelete: 'CASCADE'
        },
        reset_code_hash: {
            type: 'text',
            notNull: true
        },
        verification_token: {
            type: 'text'
        },
        expires_at: {
            type: 'timestamptz',
            notNull: true
        },
        used: {
            type: 'boolean',
            notNull: true,
            default: false
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    // 添加索引
    pgm.createIndex('password_reset_requests', 'user_id');
    pgm.createIndex('password_reset_requests', 'verification_token');

    // 创建自动更新updated_at的触发器
    pgm.createTrigger('password_reset_requests', 'set_timestamp', {
        when: 'BEFORE',
        operation: 'UPDATE',
        level: 'ROW',
        language: 'plpgsql',
        replace: true,
        function: `
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        `
    });

    // 添加RPC函数用于在运行时创建表（如果不存在）
    pgm.createFunction(
        'create_password_reset_table',
        [],
        { returns: 'void', language: 'plpgsql' },
        `
        BEGIN
            IF NOT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'password_reset_requests'
            ) THEN
                CREATE TABLE public.password_reset_requests (
                    id uuid PRIMARY KEY NOT NULL,
                    user_id uuid NOT NULL REFERENCES public.user_profiles ON DELETE CASCADE,
                    reset_code_hash text NOT NULL,
                    verification_token text,
                    expires_at timestamptz NOT NULL,
                    used boolean NOT NULL DEFAULT false,
                    created_at timestamptz NOT NULL DEFAULT current_timestamp,
                    updated_at timestamptz NOT NULL DEFAULT current_timestamp
                );

                CREATE INDEX ON public.password_reset_requests (user_id);
                CREATE INDEX ON public.password_reset_requests (verification_token);

                CREATE TRIGGER set_timestamp
                BEFORE UPDATE ON public.password_reset_requests
                FOR EACH ROW
                EXECUTE FUNCTION public.trigger_set_timestamp();
            END IF;
        END;
        `
    );
};

exports.down = pgm => {
    pgm.dropFunction('create_password_reset_table', [], { ifExists: true });
    pgm.dropTable('password_reset_requests', { ifExists: true });
};