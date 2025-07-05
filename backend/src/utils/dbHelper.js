import { supabase } from '../supabaseClient.js';

/**
 * 通用数据库操作工具
 */
export const dbHelper = {
    /**
     * 执行数据库操作并处理错误
     */
    async execute(operation, errorMessage = '数据库操作失败') {
        try {
            const result = await operation();
            if (result.error) {
                console.error('DB error:', result.error);
                return { success: false, error: { message: errorMessage } };
            }
            return { success: true, data: result.data };
        } catch (error) {
            console.error('DB error:', error);
            return { success: false, error: { message: errorMessage } };
        }
    },

    /**
     * 查询表
     */
    query(table) {
        return {
            // 查询单个记录
            findOne: (conditions) => this.execute(() =>
                supabase.from(table).select().match(conditions).single()
            ),

            // 查询多个记录
            find: (conditions, options = {}) => {
                let query = supabase.from(table).select(options.select || '*');
                if (conditions) query = query.match(conditions);
                if (options.orderBy) query = query.order(options.orderBy.field, { ascending: options.orderBy.ascending });
                return this.execute(() => query);
            },

            // 创建记录
            create: (data) => this.execute(() =>
                supabase.from(table).insert(data).select().single()
            ),

            // 更新记录
            update: (conditions, data) => this.execute(() =>
                supabase.from(table).update(data).match(conditions).select()
            ),

            // 删除记录
            delete: (conditions) => this.execute(() =>
                supabase.from(table).delete().match(conditions)
            )
        };
    }
};