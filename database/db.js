var mysql   = require('mysql');
var config  = require('../config');
var pool    = mysql.createPool({
    connectionLimit : 100, //important
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    debug:  false
});

exports.query = function(query, values, onSuccess, onError) {
    pool.getConnection(function(err, connection) {
        if (err) {
            onError(err);
            return;
        }
        
        connection.query(query, values, function(err, results, fields) {
            connection.release();
            if (err) {
                onError(err);
            } else {
                onSuccess(results, fields);
            }
        });
    });
}