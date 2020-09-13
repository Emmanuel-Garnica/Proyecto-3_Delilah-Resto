const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const sequelize = new Sequelize('mysql://root:@localhost:3306/delilah_resto');

const firma = 'E57a_E5_1a_F7rma_De1_Pr0yec70';

app.use(bodyParser.json());

//Middleware para autenticar al usuario

const auntenticarUsuario = (req, res, next) => {

    try {
        const signed = req.headers.authorization.split(' ')[1];
        const verificarToken = jwt.verify(signed, firma);
        console.log(verificarToken)
        if (verificarToken) {
            req.usuario = verificarToken;
            console.log("Este es el segundo" + verificarToken)
            return next();
        }
    } catch (error) {
        res.json({ error: 'Error al validar usuario' });
    }

};

//Middleware para validar si es admin o no

const esAdmin = (req, res, next) => {

    const signed = req.headers.authorization.split(' ')[1];
    const verificarToken = jwt.verify(signed, firma);
    const email = verificarToken.email;

    sequelize.query('SELECT es_admin FROM usuarios WHERE email = ?', { replacements: [email] })
        .then((resultados) => resultados[0])
        .then((array) => array[0].es_admin)
        .then(es_admin => {

            if (es_admin === 1) {
                next();
            } else {
                res.status(403).json({ error: "No tiene permitido el acceso." });
            }
        })

};

//Obtener todos los productos

app.get('/productos', (req, res) => {

    sequelize.query(
        'SELECT * FROM productos', { type: sequelize.QueryTypes.SELECT }
    ).then(resultados => {
        console.log(resultados)
        res.status(200).json(resultados)
    })

});

//Agregar producto (solo admin)

app.post('/productos', esAdmin, (req, res) => {

    const { producto, precio, foto } = req.body;

    sequelize.query(
        'INSERT INTO productos (producto, precio, foto) VALUES (?, ?, ?)', { replacements: [producto, precio, foto] }
    ).then(resultados => {
        console.log(resultados)
        res.status(201).json({ id: resultados[0], producto, precio, foto });
    });

});

//Actualizar producto (solo admin)

app.patch('/productos', esAdmin, (req, res) => {

    const { id, producto, precio, foto } = req.body;

    sequelize.query(
        `UPDATE productos SET precio = ${precio} WHERE id = ?`, { replacements: [id] }
    ).then(resultados => {
        console.log(resultados)
        res.status(200).json({ id: resultados[0], producto, precio, foto })
    })

});

//Borrar productos (solo admin)

app.delete('/productos', esAdmin, (req, res) => {

    const producto = req.body.producto;

    sequelize.query(
        'DELETE FROM productos WHERE producto =?', { replacements: [producto] }
    ).then(resultados => {
        console.log(resultados)
        res.status(200).json(resultados)
    })

});

//Middleware para asegurar el suministro de todos los datos de registro

function suministraDatosReg(req, res, next) {

    const { nombre_y_apellido, email, telefono, direccion, contrasena } = req.body;

    if (!nombre_y_apellido || !email || !telefono || !direccion || !contrasena) {
        return res.status(400).json({ error: "Debe llenar todos los campos para continuar." });
    } else {
        next();
    }

}

//Middleware para verificar si el email ya se encuentra registrado

function existeEmail(req, res, next) {

    const { email } = req.body;

    sequelize.query(
            'SELECT email FROM usuarios WHERE email = ?', { replacements: [email] }
        ).then((resultados) => resultados[0])
        .then((array) => array[0])
        .then(obj => {

            if (obj === undefined) {
                next();
            } else {
                res.status(200).json({ Error: "Este correo ya se encuentra registrado." });
            }
        })

}

//Registrar nuevo usuario

app.post('/usuarios', suministraDatosReg, existeEmail, (req, res) => {

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

//Login de usuarios

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

            console.log(obj);

            if (obj === undefined) {
                return res.sendStatus(401);
            };

            const { hash, email, nombre_y_apellido } = obj;

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
                email,
                nombre_y_apellido
            }, firma);

            res.json({ token });

        })
        .catch(function(error) {
            console.log(error);
            return res.sendStatus(500);
        });

});

//Crear pedido

app.post('/pedidos', (req, res) => {

    const { estado, hora, cantidad, forma_pago } = req.body;

    sequelize.query(
        'INSERT INTO pedidos (estado, hora, cantidad, forma_pago) VALUES (?, ?, ?, ?)', { replacements: [estado, hora, cantidad, forma_pago] }
    )

})

app.post('/pruebaAdmin', esAdmin, (req, res) => {
    res.sendStatus(200);
    console.log('SUCCESS - Es admin.')
})

app.post('/seguro', auntenticarUsuario, (req, res) => {
    res.send(`Esta es una página autenticada. Hola ${req.usuario.nombre_y_apellido}`);
});

app.use((err, req, res, next) => {

    if (!err) return next();
    console.log('Error, algo salió mal', err);
    res.sendStatus(500);

});

//Para enviar a la página personalizada de not found
// app.all("*", function(req, res) {
//     return res.status(404).send('page not found')
// });

app.listen(3000, () => {
    console.log('Servidor iniciado en el puerto 3000. ')
});