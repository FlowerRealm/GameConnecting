/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.dropTable('user_organization_memberships', { ifExists: true });
    pgm.dropTable('organizations', { ifExists: true });
};

exports.down = pgm => {
    // 空的 down 函数，因为我们不希望恢复删除操作
};