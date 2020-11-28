const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const sequelize = new Sequelize('mysql://root:@localhost:33067/delilah_resto');

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
        'INSERT INTO productos (producto, precio) VALUES (?, ?)', { replacements: [producto, precio] }
    ).then(resultados => {
        console.log(resultados)
        res.status(201).json({ id: resultados[0], producto, precio });
    });

});

//Actualizar producto (solo admin)

app.patch('/productos', esAdmin, (req, res) => {

    const { id, producto, precio } = req.body;

    sequelize.query(
        `UPDATE productos SET producto = "${producto}", precio = ${precio} WHERE id = ?`, { replacements: [id] }
    ).then(resultados => {
        res.status(200).json({ "Resultado" : "Producto actualizado !!" })
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
            'SELECT id, nombre_y_apellido, email, hash, es_admin FROM usuarios WHERE email = ?', { replacements: [email] }
        ).then((resultados) => resultados[0])
        .then((array) => array[0])
        .then(async(obj) => {

            console.log(obj);

            if (obj === undefined) {
                return res.sendStatus(401);
            };

            const { id, hash, email, nombre_y_apellido, es_admin } = obj;

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
                id,
                email,
                nombre_y_apellido,
                es_admin
            }, firma);

            res.json({ token });

        })
        .catch(function(error) {
            console.log(error);
            return res.sendStatus(500);
        });

});

// Obtener todos los usuarios

app.get('/usuarios', esAdmin, (req, res) => {

    sequelize.query(
        'SELECT * FROM usuarios'
    ).then( resultados => {
        res.status(200).json( { resultados } )
    })

})

//Crear pedido

app.post('/pedidos', (req, res) => {

    // Se puede dejar el id del usuario dentro del token para no realizar la tarea con el query del email (aún no sé como sacar el id del usuario)
    const signed = req.headers.authorization.split(' ')[1];
    const verificarToken = jwt.verify(signed, firma);
    const email = verificarToken.email;
    const id_cliente = verificarToken.id;
    let id_pedido;


    const { productos, fecha_pedido, forma_pago } = req.body;

    const id_productos = Object.keys(productos);
    const cantidades_productos = Object.values(productos);  
  
    sequelize.query(
        'INSERT INTO pedidos (id_cliente, fecha_pedido, forma_pago) VALUES (?, ?, ?)', { replacements: [id_cliente, fecha_pedido, forma_pago] }
    ).then( resultados => {
        id_pedido = resultados[0]
        console.log("Este es el id guardado: " + id_pedido);
        console.log("Pedido creado!");


        for(let i=0; i < id_productos.length; i++) {

            sequelize.query(
                'INSERT INTO productos_pedido (id_pedido, id_producto, cantidad) VALUES (?, ?, ?)', { replacements: [id_pedido, id_productos[i], cantidades_productos[i]] }
            ).then( resultados => {
                console.log(resultados)
                res.status(200).json( { "Resultado" : "Success !!" } )
            })

        };
        

    })

});

// Actualizar estado del pedido

app.patch('/estado_pedidos', esAdmin, (req, res) => {

    const { id_pedido, nuevo_estado } = req.body;

    sequelize.query(
        `UPDATE pedidos SET estado = "${nuevo_estado}" WHERE id = ?`, { replacements : [ id_pedido ] }
    ).then( resultados => {
        console.log("Actualizando pedido: " + resultados)
        res.status(200).json( { "Resultado" : "Estado de pedido actualizado !!" } )
    })

});

// Editar pedido

app.patch('/pedidos', esAdmin, (req, res) => {

    const { id_pedido, fecha_pedido, forma_pago, estado } = req.body;

    sequelize.query(
        `UPDATE pedidos SET fecha_pedido = "${fecha_pedido}", forma_pago = "${forma_pago}", estado = "${estado}" WHERE id = ?`, { replacements : [ id_pedido ] }
    ).then(resultados => {
        console.log(resultados)
        res.status(200).json({ "Resultado" : "Pedido actualizado !!" })
    })

});

// Eliminar pedido

app.delete('/pedidos', esAdmin, (req, res) => {

    const { id_pedido } = req.body;

    sequelize.query(
        'DELETE FROM pedidos WHERE id = ?', { replacements : [id_pedido] }
    ).then(resultados => {
        console.log(resultados)
        res.status(200).json({ "Resultado" : "Pedido eliminado !!" })
    })

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