# Everygen 自动化试用

Zapier 和 n8n 共用你自己的 Everygen 账号和积分。开发版试用与平台公开上架是两个阶段；请以发布记录中的实时状态为准。

## Zapier

[加入 Everygen 1.0.0 试用](https://zapier.com/developer/public-invite/247154/514935/26b498ffb9f9a3cb43da90a4c7ba95b5/)

1. 接受邀请后，新建 Zap，选择 Everygen。
2. 连接你自己的 Everygen 账号，并核对授权页显示的 Zapier 站点。
3. 添加 Start Image Generation 或 Start Video Generation。
4. Request ID 映射上游事件的唯一标识；同一事件的不同生成步骤加上步骤名/版本号。不要给所有事件填同一个常量。
5. 明确填写 Max Credits。它是单次积分上限，超过上限直接拒绝；失败后不要为了重试随机换 Request ID。
6. 运行后先得到任务编号。另建一个以 Everygen → Generation Completed 开始的 Zap，拿完成后的 URL 接入你需要的表格、存储等操作。
7. 真实启用并跑成功，记录 Zap 链接、操作名、任务编号和成功时间。发送反馈时不包含密码、令牌或别人的素材。

首个完成触发器可能需要等平台轮询和 Everygen 后台刷新。创建动作不会等待图片/视频完成。完成触发器会看到该账号其他流程和网站完成的媒体，可以按类型或任务 ID 筛选。

## n8n

首版以 n8n 2.41.6 / Node.js 24 为联调目标。npm 发布后，自托管实例在 Community Nodes 安装 n8n-nodes-everygen；n8n Cloud 要等官方验证通过。

新增 Everygen OAuth2 API 凭据，登录自己的 Everygen 账号。服务器回调需要 HTTPS 和默认 /rest/oauth2-credential/callback 路径；本地开发可用 HTTP localhost。填写 Request ID、Prompt、Max Credits 后执行 Everygen 节点。用 Everygen Trigger 等完成，或 Wait 后 Get Generation。

## 反馈记录

记录：平台/版本、所用操作、测试时间、任务编号、预期与实际结果、是否成功产出素材。失败时保留原 Request ID。`needs_attention` 表示结果不确定，先核查原任务，避免重复生成。测试会消耗账号已有积分；使用最小合适设置和明确的单次上限。
