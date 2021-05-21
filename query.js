const mysql = require("mysql");
const dbConfig = {
  host: "",
  port: "",
  user: "",
  password: "",
  database: "",
  connectionLimit: 30,
};

let pool = mysql.createPool(dbConfig);

exports.insertColor = (car_data) => {
  return new Promise((resolved, rejected) => {
    pool.getConnection((err, conn) => {
      if (!err) {
        let sql = `
        INSERT IGNORE INTO
            tb_car_color
        VALUES 
            (?, ?, ?, ?, ?, ?)
        `;
        conn.query(
          sql,
          [
            car_data.car_model_no,
            car_data.car_name,
            car_data.car_brand_no,
            car_data.car_brand_name,
            car_data.car_color_code,
            car_data.car_color,
          ],
          (error, rows) => {
            if (error) {
              rejected(error);
            }
            resolved(rows); //수행결과
            console.log('done');
          }
        );
      } else {
        console.error(err);
      }
      // 커넥션을 풀에 반환
      conn.release();
    });
  });
};