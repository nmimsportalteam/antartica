
module.exports = {
    getDashboard: (req, res, next) => {
        res.render('dashboard')
    },

    userList: (req, res, next) => {
        let db = req.app.locals.db;
        let {
            limit,
            cursor,
            searchText,
            sortBy,
            sortAs
        } = req.query;

        limit == undefined ? limit = 3 : limit = limit;
        cursor == undefined ? cursor = 0 : cursor = cursor;

        const stmt = {
            text: `SELECT filter_user_json($1, $2, $3, $4, $5) AS user_list`,
            values: [Number(limit), Number(cursor), searchText, sortBy, sortAs]
        }

        db.query(stmt, async (err, obj) => {
            if (err) throw err;
            let result = await obj.rows[0].user_list;
            let jsonObj = JSON.parse(result);
            let cursor;
            if (jsonObj !== null) {
                cursor = jsonObj.reduce(
                    (max, character) => (character.id > max ? character.id : max),
                    jsonObj[0].id
                );
            }
    
            res.render('dashboard', {
                data: jsonObj,
                cursor: cursor
            })
        })




    }
}