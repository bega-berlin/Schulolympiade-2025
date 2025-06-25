-- Datenbank erstellen (falls nicht existiert)
CREATE DATABASE IF NOT EXISTS schulolympiade;
USE schulolympiade;

-- Tabelle für Wettkampfergebnisse
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team VARCHAR(100) NOT NULL,
    disziplin VARCHAR(200) NOT NULL,
    punkte INT NOT NULL,
    platz INT NOT NULL,
    uhr TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_team (team),
    INDEX idx_disziplin (disziplin),
    INDEX idx_uhr (uhr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelle für Emoji-Mappings
CREATE TABLE IF NOT EXISTS emoji_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emoji VARCHAR(10) NOT NULL,
    trigger_word VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_trigger (trigger_word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Standard-Emojis einfügen
INSERT INTO emoji_mappings (emoji, trigger_word) VALUES
('🍡', 'Marshmallow Challenge'),
('🕵️‍♂️', 'Wer ist das?'),
('🏰', 'Das Schloss'),
('🔤', 'Worttüftelei'),
('🎯', 'Geo-Dart'),
('🧱', 'Baumeister'),
('🧠', 'Merk''s dir'),
('❓', 'Quiz'),
('🪡', 'Knopf annähen'),
('🗓️', 'Wann war das doch gleich?'),
('🎶', 'Songtitel'),
('🎈', 'Luftballon'),
('🚲', 'Fahrradrennen'),
('🟰', 'Kopfrechnen'),
('🥢', 'Chopsticks'),
('🧑‍🧑‍🧒‍🧒', 'Familienduell'),
('⚽️', 'Lattenknaller'),
('🃏', 'Memory'),
('🧩', 'Puzzlen'),
('🚶', 'Figuren legen'),
('🌀', 'Ab durch die Röhre'),
('🦯', 'Blinder Hindernislauf'),
('🥚', 'Eierlauf'),
('🏉', 'Harzer-Rugby'),
('🛏️', 'Laken wenden'),
('👀', 'Menschenkenntnis'),
('⛷️', 'Sommerski'),
('🗂️', 'Sortieren'),
('🤫', 'Stille Post'),
('🪣', 'Wassertransport'),
('🥓', 'Wer stiehlt den Speck'),
('♟️', 'Wikingerschach'),
('⛵️', 'Wir fahren über ''n See'),
('🤔', 'Wir schätzen das ONG'),
('🏗️', 'Fröbelturm');

-- Beispieldaten für Tests
INSERT INTO results (team, disziplin, punkte, platz, uhr) VALUES
('Klasse 7.2', 'Wer ist das?', 10, 2, '18:10:45'),
('Klasse 8.4', 'Worttüftelei', 40, 1, '18:10:56');
