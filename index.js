const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const saltRounds = 10;

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

app.post('/usuarios', (req, res) => {

    const { nombre_y_apellido, email, telefono, direccion, contrasena } = req.body;

    const hash = bcrypt.hashSync(contrasena, 10);
    console.log(hash);
    sequelize.query(
        'INSERT INTO usuarios ( nombre_y_apellido, email, telefono, direccion, hash) VALUES (?,?,?,?,?)', { replacements: [nombre_y_apellido, email, telefono, direccion, hash] }
    ).then(resultados => {
        console.log(resultados)
        res.status(201).json({ id: resultados[0], nombre_y_apellido, email, telefono, direccion });
    });

});

app.listen(3000, () => {
    // const pass = "HolaSoyYo1960";
    // const hash = await bcrypt.hash(pass, 10);
    // console.log(hash);
    // console.log(typeof(hash))
    console.log('Servidor iniciado en el puerto 3000. ')
});