// 먼저 퇴근해서 죄송합니다 ...

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
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

car_brand_no = ['303', '304', '307', '312', '326', '321', '362', '349', '371', '376', '413', '422', '618', '367', '459', '394', '399', '381', '440', '436', '445', '390', '385', '491', '486', '514', '500', '569', '573', '546', '587']

// 514 page 많음 예외 처리 필요

let car_data = [];
let url, content, $, lists;

(async () => {
  try {
    // 브라우저를 실행
    // 옵션으로 headless 사용
    const browser = await puppeteer.launch({
      // executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: false,
      // 속도 지정 m/s
      slowMo: 50
    });

    // 새로운 페이지를 열음
    const page = await browser.newPage();
    console.log('Open browser.');

    // 페이지의 크기를 설정
    await page.setViewport({
      width: 1366,
      height: 768
    });

    // 다운로드 파일 경로 지정
    // await page._client.send('Page.setDownloadBehavior', {
    //   behavior: 'allow',
    //   downloadPath: './public/excels/'
    // });


    // for 문 필요합니다. car_brand_no[0] -> index
    url = 'http://auto.danawa.com/newcar/?Work=search&Brand=' + car_brand_no[0];
    await page.goto(url);
    console.log(`Go to url : "${url}"`);

    // 차 리스트 load 대기
    await page.waitForSelector('#autodanawa_gridC > div.gridWide > div.newcar_search > div.container_newcarlist > div.contents');

    // cheerio = jquery 방식 셀렉트 모듈
    // car list 접근
    content = await page.content();
    $ = cheerio.load(content);
    lists = $('.list.modelList > li');

    let car_name, model_no;
    // 차 이름 가져오기
    lists.each((idx, list) => {
      car_name = $(list).find('div.info > div > div > a.name.sendGA').text();
      car_name = car_name.replace(/\t/g, "");
      car_name = car_name.replace(/\n/g, "");

      // 차 model number 가져오기
      model_no = $(list).find('div.info > div > div > a.name.sendGA').attr('model');

      // car_data에 집어 넣기 (python의 append 개념)
      car_data.push({
        'car_model_no': model_no,
        'car_name': car_name,
        'car_brand_no': car_brand_no[0],
        'car_color': []
      });
      // console.log({ idx, car_name, model_no });
    });

    let colorList, element, btn, car_color_name, car_color_cd;
    // 여기 주석은 무시하세요.

    // for (let i = 0; i < lists.length; i++) {
    //   url = `http://auto.danawa.com/auto/?Work=model&Model=${car_data[i]['car_model_no']}&attributeList=`;
    //   await page.goto(url, {
    //     waitUntil: 'networkidle2',
    //   });
    //   console.log(`Go to url : "${url}"`);

    //   // #autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div > button:nth-child(2)

    //   // #autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div > button:nth-child(3)

    // }

    // 차 model number로 자세한 페이지 이동
    url = `http://auto.danawa.com/auto/?Work=model&Model=${car_data[0]['car_model_no']}&attributeList=`;
    // 페이지 로드 대기
    await page.goto(url, {
      waitUntil: 'networkidle2',
    });

    // color 리스트 접근
    colorList = await page.$$('#autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div > button');
    console.log(colorList.length);

    if (colorList.length > 0) {
      // loop 필요합니다. hover가 필요할 것 같아 직접 넣어서 했는데
      // 유능하신 윤재님은 아까 html 로드해서 다 가져온다고 하셨으니...
      // for (let i = 2; i < colorList.length; i++) {
      // hover 효과 적용
      await page.hover(`#autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div > button:nth-child(2)`);

      // 색상 이름이 담긴 태그 접근
      element = await page.$('#autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div > div');

      // 색상 이름 가져오기
      car_color_name = await page.evaluate(el => el.textContent, element);

      // 이 부분 무시하세요.
      // element = document.querySelector('#autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div > button:nth-child(2)');
      // comStyles = window.getComputedStyle(element);
      // car_color_cd = comStyles.getPropertyValue('background');

      // 차 색상 태그 접근하여 색상 코드 가져오기
      car_color_cd = await page.evaluate(() => {
        btn = document.querySelector(`#autodanawa_gridC > div.gridMain > article > main > div.modelSummary.auto.new > div.photo > div > button:nth-child(2)`);
        return getComputedStyle(btn).getPropertyValue('background-color');
      });
      // car_color_cd = compStyles.getPropertyValue('background');

      // 최상단에 rgbToHex 함수가 있습니다. 적용안하면 rgb (), (), () 형태로 나와서 변환 필요.
      console.log(car_color_name, rgbToHex(car_color_cd));
      // }
    }

    browser.close();
    // 최종 car_data 찍어보기
    // console.log(car_data);
  }
  catch (err) {
    console.error(err);
  }
})();
