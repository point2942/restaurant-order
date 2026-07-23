# 餐廳點餐系統

包含四個使用介面：
- `customer.html`：顧客掃桌上 QR Code 自行點餐（內用）
- `staff.html`：服務生用平板/手機幫顧客點餐
- `online.html`：外帶／外送線上點餐
- `kitchen.html`：廚房出單畫面（即時更新）
- `admin.html`：後台管理（菜單、桌位 QR Code、訂單總覽）

---

## 一、建立 Supabase 資料庫

1. 前往 https://supabase.com 註冊並登入，點「New project」建立一個新專案（記下您設定的資料庫密碼）。
2. 專案建立完成後，左側選單點「SQL Editor」。
3. 點「New query」，把本專案的 `supabase-schema.sql` 檔案內容整個貼進去，按右下角「Run」執行。
4. 執行成功後，左側選單點「Table Editor」，應該會看到 `categories`、`menu_items`、`dining_tables`、`orders`、`order_items` 五張表格，且 `categories` 和 `dining_tables` 已有預設範例資料。
5. 左側選單點「Project Settings」→「API」，記下三組資訊，等一下會用到：
   - `Project URL`
   - `anon public` key
   - `service_role` key（⚠️ 這組是後台密鑰，不要外流）

---

## 二、把專案上傳到 GitHub

1. 打開 GitHub Desktop，選「File」→「Add local repository」，選擇這個專案的資料夾。
2. 如果跳出「這不是一個 git 儲存庫」的提示，選「create a repository」。
3. 左下角填寫 commit 訊息（例如「建立餐廳點餐系統」），點「Commit to main」。
4. 點右上角「Publish repository」，名稱可自訂（例如 `restaurant-ordering-system`），選擇公開或私人皆可，點「Publish Repository」。

---

## 三、部署到 Render

1. 前往 https://render.com 註冊並登入，建議直接用 GitHub 帳號登入，方便串接。
2. 點右上角「New」→「Web Service」。
3. 選擇剛剛發布的 GitHub 儲存庫（第一次使用需要授權 Render 存取您的 GitHub）。
4. 設定畫面填寫：
   - **Name**：自訂名稱，例如 `restaurant-ordering`
   - **Region**：選 Singapore（離台灣較近）
   - **Branch**：main
   - **Build Command**：`npm install`
   - **Start Command**：`npm start`
   - **Instance Type**：Free 即可先行測試
5. 往下捲動到「Environment Variables」，點「Add Environment Variable」，新增三筆（值從步驟一取得）：
   - `SUPABASE_URL` = 您的 Project URL
   - `SUPABASE_ANON_KEY` = 您的 anon public key
   - `SUPABASE_SERVICE_KEY` = 您的 service_role key
6. 點「Create Web Service」，等待幾分鐘完成部署。
7. 部署完成後，畫面上方會顯示網址，例如 `https://restaurant-ordering.onrender.com`，這就是您的系統網址。

---

## 四、開始使用

部署完成後，各頁面網址如下（把網址換成您實際的 Render 網址）：

| 用途 | 網址 |
|---|---|
| 後台管理（先來這裡設定菜單、新增桌位） | `https://您的網址/admin.html` |
| 服務生點餐 | `https://您的網址/staff.html` |
| 外帶外送線上點餐 | `https://您的網址/online.html` |
| 廚房出單畫面 | `https://您的網址/kitchen.html` |
| 顧客掃碼點餐 | 不用手動輸入，請至「後台管理→桌位管理」下載/截圖各桌的 QR Code 並列印貼在桌上 |

**建議操作順序：**
1. 先進入 `admin.html` 的「菜單管理」，把範例分類（前菜/主餐/飲料/甜點）改成您實際的菜色與價格。
2. 進入「桌位管理」，新增您實際的桌號（例如 A1、A2...），系統會自動產生對應的 QR Code，截圖後送印刷貼在桌上。
3. 平板或手機瀏覽器開啟 `staff.html`，加入手機主畫面即可當作服務生點餐機使用。
4. 廚房用一台平板或電腦常駐開啟 `kitchen.html`，會自動即時顯示新訂單。

---

## 五、日後修改

- 若我（Claude）之後幫您調整功能，會提供**完整替換檔案**，您只需要在 GitHub Desktop 中用新檔案覆蓋舊檔案、Commit、Push，Render 會自動偵測並重新部署，不需要重新設定環境變數。
- 若修改到 `supabase-schema.sql`，需要自行到 Supabase 的 SQL Editor 手動執行新增的部分（我會清楚告訴您該執行哪幾行）。
