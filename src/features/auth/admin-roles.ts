/**
 * Admin-plugin role/permission configuration (least privilege).
 *
 * The admin UI only calls ban/unban/impersonate/stopImpersonating/removeUser
 * (the user list is a custom getAdminUsers query, not listUsers). We grant those
 * plus read-only `list`, and deliberately drop the credential/role-mutation
 * primitives (create/update/set-role/set-password/set-email/get): even a role
 * column tampered to 'admin' cannot rewrite users or elevate access. Keeping
 * `list` lets existing admin endpoints (listUsers) stay functional.
 *
 * ADMIN_EMAILS → role syncing is enforced by the assertAdmin() gate, not here.
 *
 * Shared by createAuth (production) and the workers tests so the permission
 * matrix is exercised against the exact same object.
 */
import { createAccessControl } from 'better-auth/plugins/access'

const adminAc = createAccessControl({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'impersonate-admins',
    'delete',
    'set-password',
    'set-email',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
})

export const adminRoles = {
  admin: adminAc.newRole({ user: ['ban', 'impersonate', 'delete', 'list'], session: [] }),
  user: adminAc.newRole({ user: [], session: [] }),
}
