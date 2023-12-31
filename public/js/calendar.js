console.clear();

console.log('== Start calendar.js  ==');

function switchBackground() {

  let nowHour = new Date().getHours();
  // console.log("[BDG] nowHour: ", nowHour);   

  /* 根據當地現在時間切換白天、夜晚背景
    example: 
            白天 - 6~18       
            晚上 - 0~5、19~24 
  */
  if((nowHour > 5) && (nowHour < 19)){
    
    let backgroundBox = document.querySelector(".background-box");
    backgroundBox.classList.remove('nightBox');
    backgroundBox.classList.add('dayBox');
    
  }else{

    let backgroundBox = document.querySelector(".background-box");
    backgroundBox.classList.remove('dayBox');
    backgroundBox.classList.add('nightBox');

    /* cat */
    gsap.to("#left-hand", {
      rotate: -20,
      transformOrigin: "top",
      repeat: -1,
      yoyo: true,
      duration: 2,
      ease: "power1.inOut"
    });
  } 
}

let tbody = document.querySelector("tbody");  
    
let calendar = {  
  year: null,
  month: null,

  // 日的陣列
  dayTable: null,

  /* 3.生成日曆 */
  // from => table 表格，date => 要建立的日期
  createCalendar(form, date) {
    let self = this;

    // 獲取此時的年份
    year = self.year;
    year = date.getFullYear();

    // 獲取此時的月份
    month = self.month;
    month = date.getMonth();

    // 月份以 字串格式 呈現
    let monthArray = ["January", "February", "March", "April", 'May', "June",
                      "July", "August", "September", "October", "November", "December"]; 
    let monthString = monthArray[month];
    
    // 年份月份寫入日曆
    form.getElementsByTagName("th")[1].innerText = monthString + '\xa0\xa0\xa0' + year;

    // 獲取本月的天數
    let MonthDayCount = self.getDateLen(year, month);            
    // console.log("============", MonthDayCount, "============"); // 31 
    let firstDay      = self.getFirstDay(year, month);
    // console.log("============", firstDay, "============"); // 5

    // 一個月的日期填滿格子最多會有 6 週
    for (let week = 1; week <= 6; week++){  

      let tr = document.createElement('tr');

      // 設置 class 屬性
      tr.classList.add('day');

      // 設置 data-* 屬性
      let dataset     = document.createAttribute("dataset");
      tr.dataset.week = `week-${[week]}`;

      // 一週 7 天，7 個 td
      for (let day = 1; day <= 7; day++) {

        let td  = document.createElement("td");
        let a   = document.createElement("a");

        // 設置 href 屬性
        let href   = document.createAttribute("href");     
        href.value = '/dayPlan';
        a.setAttributeNode(href); 

        // 父節點 加入 子節點      
        td.appendChild(a);         
        tr.appendChild(td); 
      }

      tbody.appendChild(tr);
    }
    
    // date 表示日期，迴圈將每一天的天數寫入到日曆中
    for (let date = 1; date <= MonthDayCount; date++){  

      let aTags = document.querySelectorAll("td > a");
      aTags[firstDay + date - 1].textContent = date;

      let nowDate = new Date();

      if 
      (
        date  === nowDate.getDate() &&
        month === nowDate.getMonth() &&
        year  === nowDate.getFullYear()
      )
      {
        // 將 當天 元素的 id 設定為 today
        aTags[firstDay + date - 1].id = 'today';
      }

      /* 處理路徑尾端想要放置的資料型態為字串後，再丟入 a 標籤中 href 屬性值  
      Example:
        2022.12.25 --> /dayPlan/2022-12-25
        2023.1.1   --> /dayPlan/2023-1-1
      */
      let timeString = '/dayPlan/'+ year + '-' + (month + 1) + '-'+ date;
      aTags[firstDay + date - 1].setAttribute('href', timeString);
    }

    // 一個月只有 5 週時，刪除多餘的 最後1週(tr)
    let extraTr = tbody.lastChild;  
    let extraTd = extraTr.firstChild;
    let extraA  = extraTd.firstChild;
    
    // 取出最後1週第1天的文字
    let extraTrFirstA = extraA.textContent;    
    
    // 若 最後 1 週 第 1 天 無日期(空字串)，則刪除 最後 1 週
    if(extraTrFirstA === ''){  
      extraTr.remove();

      // 1 個月有 5 週 [暫時不需要該屬性]
      // let calendarBox = document.querySelector(".calendar");
      // calendarBox.style.transform = 'scale(0.85, 0.85)'; 

      /* 黑夜: 貓的位置 old-> y="78" 第二版 y="90" 第三版 y="138" */
      let catAbove = document.querySelector(".cat-position");
      catAbove.setAttribute('y', '80');
    }
    else{

      // 1 個月有 6 週 [暫時不需要該屬性]
      // let calendarBox = document.querySelector(".calendar");
      // calendarBox.style.transform = 'scale(0.75, 0.75)'; 

      /* 黑夜: 貓的位置 old-> y="562", 第二版 y="623" */
      let catBelow = document.querySelector(".cat-position");
      // catBelow.setAttribute('y', '548'); //old: 590 [暫時不需要該屬性]
      catBelow.setAttribute('y', '40'); //old: 590
    }

    // 處理 無日期(空字串) 的格子，使其點擊無法連結(移除它的 a 標籤)
    let aTags = document.querySelectorAll("a");
    for (let i = 0; i < aTags.length; i++){

      if(aTags[i].textContent === ''){  
        aTags[i].remove();
      }      
    } 
  },

  // 獲取本月份的天數
  getDateLen(year, month) {
    // 獲取下個月的第一天
    let nextMonth = new Date(year, month + 1, 1);

    // console.log(nextMonth.getHours()); // 0

    // 設定下月第一天的小時-1，也就是上個月最後一天的小時數，隨便減去一個值不要超過24小時
    nextMonth.setHours(nextMonth.getHours() - 1);

    // console.log(nextMonth.setHours(-1)); // 1659193200000

    // console.log(nextMonth.getDate()); // 30

    // 獲取此時下個月的日期，就是上個月最後一天
    return nextMonth.getDate();
  },

  // 獲取本月第一天為星期幾
  getFirstDay(year, month) {
    let firstDay = new Date(year, month, 1);
    return firstDay.getDay();
  },

  // 清除日曆資料
  clearCalendar(form) {
    
    let oldTrs = form.querySelectorAll(".day");

    for (let i = 0; i < oldTrs.length; i++) {

      oldTrs[i].remove();

      // console.log(oldTrs[i]);  // 印出7月份的日期資料  ===============[延伸]===============
    }
    // console.log(tbody);        // tr 印出8月份的日期資料
  },

  // 初始化函數
  init(form) {
    /* 1.獲取日陣列 */
    dayTable = form.getElementsByTagName("a");

    /* 2.建立日曆，傳入當前時間 */ 
    this.createCalendar(form, new Date());

    let nextMon = form.getElementsByTagName("th")[2];
    let preMon  = form.getElementsByTagName("th")[0];

    preMon.onclick = function () {
      calendar.clearCalendar(form);
      let preDate  = new Date(year, month - 1, 1);
      calendar.createCalendar(form, preDate);
    };

    nextMon.onclick = function () {
      calendar.clearCalendar(form);
      let nextDate  = new Date(year, month + 1, 1);
      calendar.createCalendar(form, nextDate);
    };
    // deleteExtraTr(form); 
  },
};

// 取得當月的待辦事項
async function Api_GetMonthTodoList(time){
      
  let apiUrl   = '/api/monthPlan/'+ time;
  
  let response = await fetch(apiUrl, 
      {
          method  : 'GET', 
          headers : {'Content-Type': 'application/json'}
      }
  ); 

  let result = await response.json();
  return result;      
}

// 取得當月全部的待辦事項
async function GetMonthTodoList(){

  let aTag      = document.querySelector(".day > td > a");
  let href      = aTag.getAttribute('href');
  let dateParts = href.split('/')[2].split('-');

  let year  = dateParts[0]; 
  let month = dateParts[1]; 
  let time  = month + "-" + year;
  
  let result = await Api_GetMonthTodoList(time);

  if(result.error)
    return; 
  
  if(result.data.length === 0){
    return; 
  } 
  else{
    let monthAllTodoItem = result.data;
    console.log(monthAllTodoItem);
    for(let i = 0; i < monthAllTodoItem.length; i++){
      year  = monthAllTodoItem[i].year;
      month = monthAllTodoItem[i].month;
      day   = monthAllTodoItem[i].day;
      AddOneFoodImg(year, month, day);
    }     
  }     
}

function checkDayOrNight() {

  let nowHour = new Date().getHours();

  if((nowHour > 5) && (nowHour < 19))
    
    return "day";  
    
  else

    return "night";  
}

function AddOneFoodImg(year, month, day){

  // 尋找超連結標籤
  let aTag = document.querySelector(`a[href="/dayPlan/${year}-${month}-${day}"]`);

  if(aTag === null) // 如果找不到標籤，則執行下列程式
    return;         // 中斷執行

  /* Img */ 
  let foodImg = document.createElement('img');
  let src     = document.createAttribute('src');

  /* 確認 白天、夜晚時間，各切換成 骨頭 或 魚 */
  let timeState = checkDayOrNight();

  if(timeState === "day"){
    src.value   = "../img/icon/calendar/bone.png";
    foodImg.setAttributeNode(src);   
  }
  else{
    src.value   = "../img/icon/calendar/fish.png";
    foodImg.setAttributeNode(src);
  }

  /* 確認是否有 div */
  let hasDiv = document.querySelector(`a[href="/dayPlan/${year}-${month}-${day}"] > div`);

  if(hasDiv === null){

    let newDiv = document.createElement('div');  
    
    newDiv.appendChild(foodImg); // 新增的 div 加入 食物圖片 
    aTag.appendChild(newDiv);   
  }
  else{

    hasDiv.appendChild(foodImg); // 原有的 div 加入 食物圖片 
    aTag.appendChild(hasDiv);  
  }

  /* 根據時間，食物圖片 切換成不同的樣式  
     ex: 白天 => 骨頭，夜晚 => 魚
  */
  let addedDiv = document.querySelector(`a[href="/dayPlan/${year}-${month}-${day}"] > div`);
  // console.log(addedDiv);
  if(timeState === "day"){

    addedDiv.classList.remove("checkNight");
    addedDiv.classList.add("checkDay");  
  }
  else{

    addedDiv.classList.remove("checkDay");
    addedDiv.classList.add("checkNight");  
  }
}

window.onload = function () {

  let form  = document.getElementById("calendar");
  let arrow = document.querySelectorAll(".arrow");

  // 通過日曆物件去呼叫自身的 init 方法
  calendar.init(form);

  // UI背景 初始化 
  switchBackground();

  // [timer] 根據當地現在時間 "即時" 切換白天、夜晚 的 UI背景
  setInterval(switchBackground, 60000);

  // 取得當月全部的待辦事項
  GetMonthTodoList();

  // [按 button 時] 取得 上個月 或 下個月 全部的待辦事項
  arrow.forEach(element => {
    element.addEventListener('click', GetMonthTodoList);
  });
};

/* 回到上一頁時，要重新向伺服器請求資料 */
window.onpageshow = function(event) {
  if (event.persisted) {     // 頁面從瀏覽器的快取中讀取該屬性返回 ture
    window.location.reload(); 
  }
};