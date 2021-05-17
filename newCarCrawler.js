// HN Refactoring

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
// const fs = require('fs');

function rgbToHex(rgb) {
  if (rgb.search("rgb") == -1) {
    return rgb;
  } else {
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
    function hex(x) {
      return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }
}

// const timer = (ms) => new Promise(res => setTimeout(res, ms));

// 크롤링 기준, 순서
// brand_no => model num => 색상

car_brand_no = [
  "303",
  "304",
  "307",
  "312",
  "326",
  "321",
  "362",
  "349",
  "371",
  "376",
  "413",
  "422",
  "618",
  "367",
  "459",
  "394",
  "399",
  "381",
  "440",
  "436",
  "445",
  "390",
  "385",
  "491",
  "486",
  "514",
  "500",
  "569",
  "573",
  "546",
  "587",
];

console.log(car_brand_no.length);

// 514 page 많음 예외 처리 필요

let car_data = [];
let url, content, $, lists;

(async () => {
  try {
    // 브라우저를 실행
    // 옵션으로 headless 사용
    const browser = await puppeteer.launch({
      // executablePath: '/usr/bin/chromium-browser',
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: false,
      // 속도 지정 m/s
      slowMo: 50,
    });

    // 새로운 페이지를 열음
    const page = await browser.newPage();
    console.log("Open browser.");

    // 페이지의 크기를 설정
    await page.setViewport({
      width: 1366,
      height: 768,
    });

    for (let i in car_brand_no) {
      url =
        "http://auto.danawa.com/newcar/?Work=search&Brand=" + car_brand_no[i];
      await page.goto(url);
      await page.waitForSelector(
        "#autodanawa_gridC > div.gridWide > div.newcar_search > div.container_newcarlist > div.contents"
      );
      content = await page.content();
      $ = cheerio.load(content);
      lists = $(".list.modelList > li");

      let car_name, model_no;

      // let car_name, model_no;
      // 차 이름 가져오기
      for (let j = 0; j < lists.length; j++) {
        car_name = $(lists[j])
          .find("div.info > div > div > a.name.sendGA")
          .text();
        car_name = car_name.replace(/\t/g, "");
        car_name = car_name.replace(/\n/g, "");

        // 차 model number
        model_no = $(lists[j])
          .find("div.info > div > div > a.name.sendGA")
          .attr("model");

        let colorList, element, car_color_name;

        // 차 model number로 자세한 페이지 이동
        url = `http://auto.danawa.com/auto/?Work=model&Model=${model_no}&attributeList=`;
        // 페이지 로드 대기
        await page.goto(url, {
          waitUntil: "networkidle2",
        });

        // color 리스트 접근
        colorList = await page.$$(
          "#autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div "
        );
        // 차종별 color 추출
        if (colorList.length > 0) {
          // 색상 이름이 담긴 태그 접근
          element = await page.$(
            "#autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div"
          );
          // 색상 이름 가져오기 태그의 색상 리스트 처리
          car_color_name = await page.evaluate((el) => el.textContent, element);
          car_color_name = car_color_name.replace(/ +/g, "");
          car_color_name = car_color_name.replace(/^\s+/, "");
          car_color_name = car_color_name.replace(/\s+$/, "");
          let division = car_color_name.split(/\n/g);

          for (let k in division) {
            // division[i].substr(0, 2);
            if (division[k] == "") division.splice(k, 1);
            if (car_color_name) {
              if (division[k].length == 0) {
                division.splice(k, 1);
              }
            }
          }
          // hover 값 제거 : 항상 0번째 원소
          division.splice(0, 1);

          let c_code = [];

          for (let p in division) {
            element_code = await page.$(
              "#autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div > button:nth-child(" +
              String(parseInt(p) + 2) +
              ")"
            );
            car_color_code = await page.evaluate((el) => {
              return getComputedStyle(el).getPropertyValue("background-color");
            }, element_code);
            c_code.push(rgbToHex(car_color_code));
          }

          car_data = {
            car_model_no: model_no,
            car_name: car_name,
            car_brand_no: car_brand_no[i],
            car_color: division,
            car_color_code: c_code,
          };
          console.log("===================");
          console.log(car_data);
        }
      }
    }
    browser.close();
  } catch (err) {
    console.error(err);
  }
})();