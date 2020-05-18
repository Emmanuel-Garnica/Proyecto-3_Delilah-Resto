const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');

const app = express();
const sequelize = new Sequelize('mysql://root:@localhost:3306/delilah_resto');

app.use(bodyParser.json());

app.get('/productos', (req, res) => {

    sequelize.query(
        'SELECT * FROM productos', { type: sequelize.QueryTypes.SELECT }
    ).then(resultados => {
        console.log(resultados)
        res.status(200).json(resultados)
    })

});

app.post('/productos', (req, res) => {

    const { producto, precio, foto } = req.body;

    sequelize.query(
        'INSERT INTO productos (producto, precio, foto) VALUES (?, ?, ?)', { replacements: [producto, precio, foto] }
    ).then(resultados => {
        console.log(resultados)
        res.status(201).json({ id: resultados[0], producto, precio, foto });
    });

});

app.patch('/productos', (req, res) => {

    const { id, producto, precio, foto } = req.body;

    sequelize.query(
        `UPDATE productos SET precio = ${precio} WHERE id = ?`, { replacements: [id] }
    ).then(resultados => {
        console.log(resultados)
        res.status(200).json({ id: resultados[0], producto, precio, foto })
    })

});

app.delete('/productos', (req, res) => {

    const producto = req.body.producto;

    sequelize.query(
        'DELETE FROM productos WHERE producto =?', { replacements: [producto] }
    ).then(resultados => {
        console.log(resultados)
        res.status(200).json(resultados)
    })

});

app.listen(3000, () => {
    console.log('Servidor iniciado en el puerto 3000. ')
});