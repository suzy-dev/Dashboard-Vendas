const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./dados.db', (err) => {
    if (err) console.error(err.message);
    console.log('Conectado ao banco de dados SQLite.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes TEXT,
        valor INTEGER
    )`);
    db.get("SELECT count(*) as count FROM vendas", (err, row) => {
        if (row.count === 0) {
            console.log("Populando banco de dados...");
            const stmt = db.prepare("INSERT INTO vendas (mes, valor) VALUES (?, ?)");
            stmt.run("Jan", 150);
            stmt.run("Fev", 230);
            stmt.run("Mar", 180);
            stmt.run("Abr", 320);
            stmt.run("Mai", 290);
            stmt.run("Jun", 450);
            stmt.finalize();
        }
    });
});

app.get('/api/vendas', (req, res) => {
    db.all("SELECT * FROM vendas", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

app.post('/api/vendas', (req, res) => {
    const { mes, valor } = req.body;
    const stmt = db.prepare("INSERT INTO vendas (mes, valor) VALUES (?, ?)");
    stmt.run(mes, valor, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "id": this.lastID
        });
    });
    stmt.finalize();
});


app.delete('/api/vendas/:id', (req, res) => {
    const { id } = req.params;
    
    db.run("DELETE FROM vendas WHERE id = ?", id, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ message: "deleted", changes: this.changes });
    });
});

app.put('/api/vendas/:id', (req, res) => {
    const { id } = req.params;
    const { mes, valor } = req.body;

    const stmt = db.prepare("UPDATE vendas SET mes = ?, valor = ? WHERE id = ?");
    stmt.run(mes, valor, id, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            message: "updated",
            changes: this.changes
        });
    });
    stmt.finalize();
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});