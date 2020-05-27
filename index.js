const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const sequelize = new Sequelize('mysql://root:@localhost:3306/delilah_resto');

const firma = 'E57a_E5_1a_F7rma_De1_Pr0yec70';

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

app.post('/login', (req, res) => {

    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
        return res.status(400).json({ error: "No se ha suministrado la información requerida." });
    };

    sequelize.query(
            'SELECT nombre_y_apellido, email, hash FROM usuarios WHERE email = ?', { replacements: [email] }
        ).then((resultados) => resultados[0])
        .then((array) => array[0])
        .then(async(obj) => {

            if (obj === undefined) {
                return res.sendStatus(401);
            };

            const { hash, nombre_y_apellido } = obj;

            try {

                const validacionContrasena = await bcrypt.compare(contrasena, hash);
                console.log(validacionContrasena);

                if (!validacionContrasena) {
                    res.status(401).send({ error: 'Datos incorrectos.' });
                    return;
                }

            } catch (error) {
                console.error("Error al usar bcrypt.compare() --> " + error)
                return res.sendStatus(500);
            }

            const token = jwt.sign({
                nombre_y_apellido
            }, firma);

            res.json({ token });

        })
        .catch(function(error) {
            console.log(error);
            return res.sendStatus(500);
        });

});

const auntenticarUsuario = (req, res, next) => {

    try {
        const signed = req.headers.authorization.split(' ')[1];
        const verificarToken = jwt.verify(signed, firma);
        if (verificarToken) {
            req.usuario = verificarToken;
            console.log(verificarToken)
            return next();
        }
    } catch (error) {
        res.json({ error: 'Error al validar usuario' });
    }

};

app.post('/seguro', auntenticarUsuario, (req, res) => {
    res.send(`Esta es una página autenticada. Hola ${req.usuario.nombre_y_apellido}`);
});

app.use((err, req, res, next) => {

    if (!err) return next();
    console.log('Error, algo salió mal', err);
    res.sendStatus(500);

});

app.listen(3000, () => {
    console.log('Servidor iniciado en el puerto 3000. ')
});