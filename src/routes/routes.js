const express = require('express');
const User = require('../models/User');
const Child = require('../models/child');
const Record = require('../models/record');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const auth = async (req, res, next) => {

    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            message: 'Token não fornecido'
        });
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
        return res.status(401).json({
            message: 'Formato do token inválido'
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId)
        .select('-password');

        if (!user) {
            return res.status(401).json({
                message: 'Usuário não encontrado'
            });
        }

        req.user = user;

        next();

    } catch (err) {
        console.error('ERRO JWT:', err);

        return res.status(401).json({
            message: 'Token inválido ou expirado'
        });
    }
};

// User Routes

router.get("/users", async (req, res) => {
    try {
        const users = await User.find().select('-password');
        return res.json(users);
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        return res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
});

// Get user by token
router.get("/user", auth, async (req, res) => {
    try {
        const user = req.user;

        return res.json(user);
    } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }
});

router.post('/user', async (req, res) => {
    try {
        const { name, login, password } = req.body;

        if (!name || !login || !password) {
            return res.status(400).json({
                message: 'Nome, login e senha são obrigatórios'
            });
        }

        const normalizedLogin = login.trim().toLowerCase();

        const existingUser = await User.findOne({
            login: normalizedLogin
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Este login já está sendo utilizado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        const user = await User.create({
            name: name.trim(),
            login: normalizedLogin,
            password: hashedPassword
        });


        return res.status(201).json({
            message: 'Usuário criado com sucesso!',
            user: {
                userId: user._id,
                name: user.name,
                login: user.login
            }
        });

    } catch (err) {
        console.error('❌ ERRO AO CRIAR USUÁRIO:');
        console.error(err);

        return res.status(500).json({
            message: 'Erro ao criar usuário',
            error: err.message
        });
    }
});

router.put("/user/:id", auth, async (req, res) => {
    const { id } = req.params;
    const { name, email, password, active } = req.body;

    try {
        await User.findByIdAndUpdate(id, { name, email, password, active }, { new: true }).select('-password');
        return res.sendStatus(204);
    } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        return res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
});

router.delete("/user/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await User.findByIdAndDelete(id);
        return res.sendStatus(204);
    } catch (err) {
        console.error('Erro ao deletar usuário:', err);
        return res.status(500).json({ message: 'Erro ao deletar usuário'});
    }
});

// Login

router.post('/login', async (req, res) => {
    const { login, password } = req.body;
    const normalizedLogin = login.trim().toLowerCase();

    try {
        const user = await User.findOne({ login: normalizedLogin });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Senha incorreta' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        return res.json({
            token,
            user: {
                userId: user._id,
                name: user.name,
                login: user.login
            }
        });
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        return res.status(500).json({ message: 'Erro ao fazer login' });
    }
});


// Child Routes

// List Children by User

router.get("/children", auth, async (req, res) => {
    try {
        const { _id } = req.user;

        const children = await Child.find({ userId: _id })
            .populate("userId");

        const childrenWithLastRecord = await Promise.all(
            children.map(async (child) => {
                const lastRecord = await Record.findOne({
                    childId: child._id
                }).sort({ date: -1 });

                return {
                    ...child.toObject(),
                    lastRecordDate: lastRecord
                        ? lastRecord.date
                        : null
                };
            })
        );

        return res.json(childrenWithLastRecord);
    } catch (err) {
        console.error("Erro ao buscar crianças:", err);

        return res.status(500).json({
            message: "Erro ao buscar crianças"
        });
    }
});


router.post("/child", auth, async (req, res) => {
    const { name, grade, description } = req.body;
    const { _id } = req.user;
    const child = new Child({ name, grade, description, userId: _id });

    try {
        await child.save();
        return res.status(201).json({ child, message: 'Criança criada com sucesso' });
    } catch (err) {
        console.error('Erro ao criar criança:', err);
        return res.status(500).json({ message: 'Erro ao criar criança' });
    }
});

router.put("/child/:id", auth, async (req, res) => {
    const { id } = req.params;
    const { name, grade, description } = req.body;

    try {
        await Child.findByIdAndUpdate(id, { name, grade, description }, { new: true });
        return res.sendStatus(204);
    } catch (err) {
        console.error('Erro ao atualizar criança:', err);
        return res.status(500).json({ message: 'Erro ao atualizar criança' });
    }
});

router.delete("/child/:id", auth, async (req, res) => {
    const { id } = req.params;

    try {
        await Child.findByIdAndDelete(id);
        return res.sendStatus(204);
    } catch (err) {
        console.error('Erro ao deletar criança:', err);
        return res.status(500).json({ message: 'Erro ao deletar criança' });
    }
});

// Record Routes

// get Records by Child ID
router.get("/records/:childId", async (req, res) => {
    try {
        const { childId } = req.params;
        const records = await Record.find({ childId }).populate({
            path: 'childId',
            populate: { path: 'userId' },
        });

        return res.json(records);
    } catch (err) {
        console.error('Erro ao buscar registros:', err);
        return res.status(500).json({ message: 'Erro ao buscar registros' });
    }
});

router.get("/records", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Busca as crianças pertencentes ao usuário
    const children = await Child.find({ userId }).select("_id");

    // Extrai os IDs das crianças
    const childIds = children.map((child) => child._id);

    // Busca os registros e popula os dados da criança
    const records = await Record.find({
      childId: { $in: childIds }
    })
      .populate("childId", "name")
      .sort({ date: -1 });

    return res.json(records);
  } catch (err) {
    console.error("Erro ao buscar registros do usuário:", err);

    return res.status(500).json({
      message: "Erro ao buscar registros"
    });
  }
});

router.post('/record', auth, async (req, res) => {
            try {
            const {
            date,
            behavior,
            participation,
            description,
            childId
            } = req.body;


        if (!date || !childId) {
            return res.status(400).json({
                message: 'A data e o ID da criança são obrigatórios'
            });
        }

        const newRecord = new Record({
            date,
            behavior,
            participation,
            description,
            childId
        });

        const savedRecord = await newRecord.save();

        return res.status(201).json({
            record: savedRecord,
            message: 'Registro criado com sucesso'
        });

    } catch (err) {
        console.error('Erro ao criar registro:', err);

        return res.status(500).json({
            message: 'Erro ao criar registro'
        });
    }

});

router.put("/record/:id", auth, async (req, res) => {
    const { id } = req.params;
    const record = req.body;

    try {
        await Record.findByIdAndUpdate(id, record, { new: true });
        return res.sendStatus(204);
    } catch (err) {
        console.error('Erro ao atualizar registro:', err);
        return res.status(500).json({ message: 'Erro ao atualizar registro' });
    }
});

router.delete("/record/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await Record.findByIdAndDelete(id);
        return res.sendStatus(204);
    } catch (err) {
        console.error('Erro ao deletar registro:', err);
        return res.status(500).json({ message: 'Erro ao deletar registro' });
    }
});

module.exports = router;