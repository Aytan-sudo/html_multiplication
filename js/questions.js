// Tirage des questions.
//
// La v1.7 tirait chaque question uniformement au hasard. Deux consequences
// facheuses : un enfant qui butait sur la table de 7 la revoyait aussi rarement
// qu'une autre, et comme le premier operande allait de 0 a 9, une question sur
// cinq etait un "0 x n" ou "1 x n" sans interet.
//
// Ici chaque fait (a x b) recoit un poids. Les faits rates remontent, les faits
// maitrises redescendent, les faits triviaux partent bas. Le tirage est ensuite
// proportionnel a ces poids : le jeu passe son temps sur ce qui coince.

const STATS_PREFIX = 'stats:';

// Poids de depart des faits triviaux : ils restent presents pour ne pas
// desorienter un debutant, mais ne monopolisent plus le tirage.
const TRIVIAL_WEIGHT = 0.2;
const UNSEEN_WEIGHT = 1.5;   // un fait jamais pose passe legerement devant
const MASTERED_WEIGHT = 0.35; // 3 bonnes reponses d'affilee sans erreur

function statsKey(playerName, operation) {
    return `${STATS_PREFIX}${globalThis.Passeport?.profilId ? 'profil' : playerName}:${operation}`;
}

function loadStats(playerName, operation) {
    return GameStorage.getJSON(statsKey(playerName, operation), {});
}

function saveStats(playerName, operation, stats) {
    GameStorage.setJSON(statsKey(playerName, operation), stats);
}

class QuestionPicker {
    constructor(config) {
        this.config = config;
        this.stats = loadStats(playerLabel(config), config.operation);
        this.lastKey = null;
        this.facts = this.buildFacts();
    }

    buildFacts() {
        const facts = [];
        for (let a = 0; a <= this.config.maxFirstOperand; a++) {
            for (const b of this.config.selectedNumbers) {
                facts.push({ a, b, key: `${a}x${b}` });
            }
        }
        return facts;
    }

    // Un fait est trivial quand un des operandes rend le calcul immediat.
    // En addition, ajouter 0 ou 1 ; en multiplication, multiplier par 0, 1 ou 10.
    isTrivial(a, b) {
        if (this.config.operation === 'addition') {
            return a <= 1 || b <= 1;
        }
        return a <= 1 || b <= 1 || a === 10 || b === 10;
    }

    weightOf(fact) {
        let weight = this.isTrivial(fact.a, fact.b) ? TRIVIAL_WEIGHT : 1;

        const stat = this.stats[fact.key];
        if (!stat) {
            return weight * UNSEEN_WEIGHT;
        }

        const attempts = stat.ok + stat.ko;
        if (stat.ko === 0 && stat.ok >= 3) {
            return weight * MASTERED_WEIGHT;
        }
        // Taux d'echec entre 0 et 1 : un fait toujours rate pese 3 fois plus
        // qu'un fait toujours reussi.
        const failureRate = stat.ko / attempts;
        return weight * (1 + 2 * failureRate);
    }

    next() {
        if (this.facts.length === 0) {
            return { a: 0, b: 0, key: '0x0' };
        }

        // On evite de reposer la meme question deux fois de suite, sauf quand
        // le pool ne contient qu'un seul fait.
        const pool = this.facts.length > 1
            ? this.facts.filter(f => f.key !== this.lastKey)
            : this.facts;

        let chosen;
        if (this.config.adaptive) {
            const weights = pool.map(f => this.weightOf(f));
            const total = weights.reduce((sum, w) => sum + w, 0);
            let target = Math.random() * total;
            chosen = pool[pool.length - 1];
            for (let i = 0; i < pool.length; i++) {
                target -= weights[i];
                if (target <= 0) {
                    chosen = pool[i];
                    break;
                }
            }
        } else {
            chosen = pool[Math.floor(Math.random() * pool.length)];
        }

        this.lastKey = chosen.key;
        return chosen;
    }

    record(fact, isCorrect) {
        const stat = this.stats[fact.key] || { ok: 0, ko: 0 };
        if (isCorrect) {
            stat.ok++;
        } else {
            stat.ko++;
        }
        this.stats[fact.key] = stat;
        saveStats(playerLabel(this.config), this.config.operation, this.stats);
    }
}

function expectedResult(fact, operation) {
    return operation === 'addition' ? fact.a + fact.b : fact.a * fact.b;
}

// La police Daydream ne contient pas le signe multiplie U+00D7, d'ou le x.
function operationSymbol(operation) {
    return operation === 'addition' ? '+' : 'x';
}
