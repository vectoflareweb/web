// 重导出 shim：getAdminStats/AdminStats 实现在 ./getAdminStats（无 react-start 依赖，
// 便于 workers 测试导入）；server fn 入口 getAdminStatsFn 在 ./middleware。
export { getAdminStats } from './getAdminStats'
export type { AdminStats } from './getAdminStats'
