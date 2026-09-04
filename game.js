// ============================================================
// THE GANG ARCADE - COMPLETE GAME.JS
// PC + PHONE MULTIPLAYER VERSION
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://kexexqwxcsioigqrkfco.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_gyfnuRePRt7va__Ju4NnSw_OInau_Gz";

if (
    typeof supabase === "undefined" ||
    !supabase.createClient
) {
    console.error(
        "[GAME] Supabase library was not loaded."
    );
}

const client =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            },

            realtime: {
                params: {
                    eventsPerSecond: 30
                }
            }
        }
    );


// ============================================================
// ELEMENTS
// ============================================================

const loginNotice =
    document.getElementById("loginNotice");

const gameWrap =
    document.getElementById("gameWrap");

const myUsernameLabel =
    document.getElementById("myUsername");

const playerCountLabel =
    document.getElementById("playerCount");

const canvas =
    document.getElementById("gameCanvas");

// COLOR PICKER

const playerColorPicker =
    document.getElementById("playerColorPicker");

const playerColorValue =
    document.getElementById("playerColorValue");

const ctx =
    canvas
        ? canvas.getContext("2d")
        : null;

const btnLeft =
    document.getElementById("btnLeft");

const btnRight =
    document.getElementById("btnRight");

const btnJump =
    document.getElementById("btnJump");

const btnAttack =
    document.getElementById("btnAttack");

const btnSprint =
    document.getElementById("btnSprint");

const chatMessages =
    document.getElementById("chatMessages");

const chatInput =
    document.getElementById("chatInput");

const chatSendButton =
    document.getElementById("chatSendButton");

const placeButton =
    document.getElementById("placeButton");

const placesMenu =
    document.getElementById("placesMenu");

const placeTitle =
    document.getElementById("placeTitle");

const deathMessage =
    document.getElementById("deathMessage");

const obbyLevelLabel =
    document.getElementById("obbyLevel");


// ============================================================
// PLACE
// ============================================================

const params =
    new URLSearchParams(
        window.location.search
    );

let currentPlace =
    params.get("place") || "lobby";

const validPlaces = [
    "lobby",
    "obby",
    "old",
    "city",
    "arena"
];

if (
    !validPlaces.includes(currentPlace)
) {
    currentPlace = "lobby";
}

const placeInfo = {

    lobby: {
        name: "The Lobby",
        channel: "arcade-lobby"
    },

    obby: {
        name: "The Obby",
        channel: "arcade-obby"
    },

    old: {
        name: "The Old",
        channel: "arcade-old"
    },

    city: {
        name: "The City",
        channel: "arcade-city"
    },

    arena: {
        name: "The Arena",
        channel: "arcade-arena"
    }

};


// ============================================================
// WORLD
// ============================================================

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 450;

const GROUND_Y = 400;

const PLAYER_WIDTH = 26;
const PLAYER_HEIGHT = 38;

const GRAVITY = 0.09;
const JUMP_VELOCITY = -4.8;
const MAX_FALL_SPEED = 5;
const MOVE_SPEED = 1.4;
const SPRINT_MULTIPLIER = 1.8;


// ============================================================
// ARENA COMBAT
// ============================================================

const ARENA_MAX_HEALTH = 100;

const ARENA_DAMAGE = 25;

const ARENA_ATTACK_RANGE = 62;

const ARENA_ATTACK_COOLDOWN_MS = 500;

const ARENA_ATTACK_ANIMATION_MS = 180;

let arenaHealth =
    ARENA_MAX_HEALTH;

let lastArenaAttack =
    0;

let arenaAttackUntil =
    0;

let arenaDeathInProgress =
    false;


// ============================================================
// NORMAL PLATFORMS
// ============================================================

const normalPlatforms = [

    {
        x: 0,
        y: 400,
        width: 900,
        height: 50
    },

    {
        x: 120,
        y: 320,
        width: 140,
        height: 20
    },

    {
        x: 340,
        y: 260,
        width: 120,
        height: 20
    },

    {
        x: 540,
        y: 320,
        width: 140,
        height: 20
    },

    {
        x: 720,
        y: 220,
        width: 140,
        height: 20
    },

    {
        x: 60,
        y: 180,
        width: 100,
        height: 20
    },

    {
        x: 400,
        y: 150,
        width: 100,
        height: 20
    }

];


// ============================================================
// ARENA PLATFORMS
// ============================================================

const arenaPlatforms = [

    {
        x: 0,
        y: 400,
        width: WORLD_WIDTH,
        height: 50
    },

    {
        x: 120,
        y: 330,
        width: 150,
        height: 18
    },

    {
        x: 630,
        y: 330,
        width: 150,
        height: 18
    }

];


// ============================================================
// OBBY
// ============================================================

const obbyLevels = [

    {
        name: "Level 1",

        spawn: {
            x: 25,
            y: 350
        },

        checkpoint: {
            x: 25,
            y: 350
        },

        finishX: 840,

        platforms: [

            {
                x: 0,
                y: 400,
                width: 130,
                height: 50
            },

            {
                x: 170,
                y: 350,
                width: 85,
                height: 20
            },

            {
                x: 295,
                y: 300,
                width: 85,
                height: 20
            },

            {
                x: 420,
                y: 350,
                width: 80,
                height: 20
            },

            {
                x: 535,
                y: 290,
                width: 85,
                height: 20
            },

            {
                x: 655,
                y: 250,
                width: 80,
                height: 20
            },

            {
                x: 780,
                y: 200,
                width: 120,
                height: 20
            }

        ]

    },

    {
        name: "Level 2",

        spawn: {
            x: 25,
            y: 350
        },

        checkpoint: {
            x: 25,
            y: 350
        },

        finishX: 840,

        platforms: [

            {
                x: 0,
                y: 400,
                width: 110,
                height: 50
            },

            {
                x: 145,
                y: 335,
                width: 65,
                height: 20
            },

            {
                x: 245,
                y: 275,
                width: 65,
                height: 20
            },

            {
                x: 350,
                y: 335,
                width: 60,
                height: 20
            },

            {
                x: 450,
                y: 250,
                width: 65,
                height: 20
            },

            {
                x: 555,
                y: 315,
                width: 65,
                height: 20
            },

            {
                x: 665,
                y: 225,
                width: 65,
                height: 20
            },

            {
                x: 770,
                y: 165,
                width: 130,
                height: 20
            }

        ]

    },

    {
        name: "Level 3",

        spawn: {
            x: 25,
            y: 350
        },

        checkpoint: {
            x: 25,
            y: 350
        },

        finishX: 840,

        platforms: [

            {
                x: 0,
                y: 400,
                width: 100,
                height: 50
            },

            {
                x: 135,
                y: 350,
                width: 55,
                height: 20
            },

            {
                x: 225,
                y: 290,
                width: 55,
                height: 20
            },

            {
                x: 315,
                y: 220,
                width: 55,
                height: 20
            },

            {
                x: 410,
                y: 285,
                width: 55,
                height: 20
            },

            {
                x: 500,
                y: 205,
                width: 55,
                height: 20
            },

            {
                x: 595,
                y: 275,
                width: 55,
                height: 20
            },

            {
                x: 690,
                y: 190,
                width: 55,
                height: 20
            },

            {
                x: 790,
                y: 125,
                width: 110,
                height: 20
            }

        ]

    },

    {
        name: "Level 4",

        spawn: {
            x: 25,
            y: 350
        },

        checkpoint: {
            x: 25,
            y: 350
        },

        finishX: 840,

        platforms: [

            {
                x: 0,
                y: 400,
                width: 120,
                height: 50
            },

            {
                x: 155,
                y: 340,
                width: 100,
                height: 20
            },

            {
                x: 300,
                y: 270,
                width: 70,
                height: 20
            },

            {
                x: 420,
                y: 330,
                width: 75,
                height: 20
            },

            {
                x: 545,
                y: 245,
                width: 70,
                height: 20
            },

            {
                x: 660,
                y: 190,
                width: 70,
                height: 20
            },

            {
                x: 780,
                y: 130,
                width: 120,
                height: 20
            }

        ]

    },

    {
        name: "Level 5",

        spawn: {
            x: 25,
            y: 350
        },

        checkpoint: {
            x: 25,
            y: 350
        },

        finishX: 840,

        platforms: [

            {
                x: 0,
                y: 400,
                width: 100,
                height: 50
            },

            {
                x: 130,
                y: 330,
                width: 55,
                height: 20
            },

            {
                x: 220,
                y: 250,
                width: 55,
                height: 20
            },

            {
                x: 315,
                y: 320,
                width: 55,
                height: 20
            },

            {
                x: 410,
                y: 210,
                width: 55,
                height: 20
            },

            {
                x: 510,
                y: 280,
                width: 55,
                height: 20
            },

            {
                x: 605,
                y: 180,
                width: 55,
                height: 20
            },

            {
                x: 700,
                y: 240,
                width: 55,
                height: 20
            },

            {
                x: 800,
                y: 120,
                width: 100,
                height: 20
            }

        ]

    }

];


// ============================================================
// OBBY KILL BRICKS
// ============================================================

obbyLevels.forEach(
    (level, index) => {

        if (index === 0) {

            level.killBricks = [

                {
                    x: 130,
                    y: 385,
                    width: 40,
                    height: 15
                },

                {
                    x: 255,
                    y: 385,
                    width: 40,
                    height: 15
                }

            ];

        } else if (index === 1) {

            level.killBricks = [

                {
                    x: 110,
                    y: 385,
                    width: 35,
                    height: 15
                },

                {
                    x: 210,
                    y: 385,
                    width: 35,
                    height: 15
                }

            ];

        } else if (index === 2) {

            level.killBricks = [

                {
                    x: 100,
                    y: 385,
                    width: 35,
                    height: 15
                },

                {
                    x: 190,
                    y: 385,
                    width: 35,
                    height: 15
                }

            ];

        } else if (index === 3) {

            level.killBricks = [

                {
                    x: 120,
                    y: 385,
                    width: 35,
                    height: 15
                },

                {
                    x: 255,
                    y: 385,
                    width: 35,
                    height: 15
                }

            ];

        } else {

            level.killBricks = [

                {
                    x: 100,
                    y: 385,
                    width: 30,
                    height: 15
                },

                {
                    x: 185,
                    y: 385,
                    width: 30,
                    height: 15
                }

            ];

        }

    }
);


// ============================================================
// CITY
// ============================================================

const cityBuildings = [

    {
        x: 20,
        y: 250,
        width: 100,
        height: 120,
        color: "#34495e"
    },

    {
        x: 145,
        y: 200,
        width: 120,
        height: 170,
        color: "#3b536b"
    },

    {
        x: 290,
        y: 280,
        width: 90,
        height: 90,
        color: "#425b72"
    },

    {
        x: 410,
        y: 220,
        width: 130,
        height: 150,
        color: "#334e68"
    },

    {
        x: 570,
        y: 260,
        width: 110,
        height: 110,
        color: "#405b73"
    },

    {
        x: 715,
        y: 190,
        width: 150,
        height: 180,
        color: "#3b5269"
    }

];


// ============================================================
// PLAYER STATE
// ============================================================

let myUserId =
    null;

let myUsername =
    "Loading...";

let myColor =
    "#888888";

const me = {

    x: 50,

    y: 350,

    vx: 0,

    vy: 0,

    onGround: false,

    facing: "right"

};


// ============================================================
// INPUT
// ============================================================

const keys = {

    left: false,

    right: false,

    jump: false,

    attack: false,

    sprint: false

};


// ============================================================
// MULTIPLAYER
// ============================================================

const remotePlayers = {};

const chatBubbles = {};

let gameChannel =
    null;

let multiplayerConnected =
    false;

let multiplayerJoining =
    false;

let changingPlace =
    false;

let reconnectTimer =
    null;

let lastBroadcast =
    0;

const BROADCAST_INTERVAL_MS =
    80;

const CHAT_BUBBLE_DURATION_MS =
    4000;

const MAX_CHAT_LINES =
    50;


// ============================================================
// COLORS
// ============================================================

function hslToHex(h, s, l) {

    s /= 100;
    l /= 100;

    const k = n =>
        (n + h / 30) % 12;

    const a =
        s * Math.min(l, 1 - l);

    const f = n =>
        l -
        a *
            Math.max(
                -1,
                Math.min(k(n) - 3, Math.min(9 - k(n), 1))
            );

    const toHex = x =>
        Math.round(255 * x)
            .toString(16)
            .padStart(2, "0");

    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function colorForId(id) {

    if (!id) {
        return "#888888";
    }

    let hash =
        0;

    for (
        let i = 0;
        i < id.length;
        i++
    ) {

        hash =
            (
                hash * 31 +
                id.charCodeAt(i)
            ) & 0xffffffff;

    }

    const hue =
        Math.abs(hash) % 360;

    return hslToHex(hue, 70, 60);

}


// ============================================================
// PLAYER COLOR STORAGE
// ============================================================

function getSavedPlayerColor() {

    try {

        const saved =
            localStorage.getItem(
                "theGangPlayerColor"
            );

        if (
            typeof saved === "string" &&
            /^#[0-9a-fA-F]{6}$/.test(
                saved
            )
        ) {

            return saved;

        }

    } catch (error) {

        console.warn(
            "[COLOR] Could not load saved color:",
            error
        );

    }

    return null;

}


function savePlayerColor(color) {

    try {

        localStorage.setItem(
            "theGangPlayerColor",
            color
        );

    } catch (error) {

        console.warn(
            "[COLOR] Could not save color:",
            error
        );

    }

}


function updatePlayerColorUI() {

    if (
        playerColorPicker
    ) {

        playerColorPicker.value =
            myColor;

    }

    if (
        playerColorValue
    ) {

        playerColorValue.textContent =
            myColor.toUpperCase();

    }

}


function changePlayerColor(color) {

    if (
        typeof color !== "string" ||
        !/^#[0-9a-fA-F]{6}$/.test(
            color
        )
    ) {

        return;

    }

    myColor =
        color;

    savePlayerColor(
        myColor
    );

    updatePlayerColorUI();

    // Immediately tell everyone else about the new color.

    if (
        gameChannel &&
        multiplayerConnected &&
        myUserId
    ) {

        broadcastPosition();

    }

}


// ============================================================
// COLOR PICKER EVENTS
// ============================================================

if (
    playerColorPicker
) {

    playerColorPicker.addEventListener(
        "input",
        event => {

            changePlayerColor(
                event.target.value
            );

        }
    );

}


// ============================================================
// KEYBOARD
// ============================================================

window.addEventListener(
    "keydown",
    event => {

        if (
            document.activeElement ===
            chatInput
        ) {

            return;

        }

        if (
            event.key === "ArrowLeft" ||
            event.key === "a" ||
            event.key === "A"
        ) {

            keys.left = true;

            event.preventDefault();

        }

        if (
            event.key === "ArrowRight" ||
            event.key === "d" ||
            event.key === "D"
        ) {

            keys.right = true;

            event.preventDefault();

        }

        if (
            event.key === "ArrowUp" ||
            event.key === "w" ||
            event.key === "W" ||
            event.key === " "
        ) {

            keys.jump = true;

            event.preventDefault();

        }

        if (
            event.key === "Shift"
        ) {

            keys.sprint = true;

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        if (
            event.key === "ArrowLeft" ||
            event.key === "a" ||
            event.key === "A"
        ) {

            keys.left = false;

        }

        if (
            event.key === "ArrowRight" ||
            event.key === "d" ||
            event.key === "D"
        ) {

            keys.right = false;

        }

        if (
            event.key === "ArrowUp" ||
            event.key === "w" ||
            event.key === "W" ||
            event.key === " "
        ) {

            keys.jump = false;

        }

        if (
            event.key === "Shift"
        ) {

            keys.sprint = false;

        }

    }
);


window.addEventListener(
    "blur",
    () => {

        keys.left = false;

        keys.right = false;

        keys.jump = false;

        keys.attack = false;

        keys.sprint = false;

    }
);


// ============================================================
// MOBILE CONTROLS
// ============================================================

function bindHoldButton(
    element,
    onDown,
    onUp
) {

    if (!element) {
        return;
    }

    let holding =
        false;

    function down(event) {

        event.preventDefault();

        if (holding) {
            return;
        }

        holding =
            true;

        onDown();

    }

    function up(event) {

        event.preventDefault();

        holding =
            false;

        onUp();

    }

    element.addEventListener(
        "pointerdown",
        down,
        {
            passive: false
        }
    );

    element.addEventListener(
        "pointerup",
        up,
        {
            passive: false
        }
    );

    element.addEventListener(
        "pointercancel",
        up,
        {
            passive: false
        }
    );

    element.addEventListener(
        "pointerleave",
        up,
        {
            passive: false
        }
    );

}


bindHoldButton(
    btnLeft,

    () => {
        keys.left = true;
    },

    () => {
        keys.left = false;
    }
);


bindHoldButton(
    btnRight,

    () => {
        keys.right = true;
    },

    () => {
        keys.right = false;
    }
);


bindHoldButton(
    btnJump,

    () => {
        keys.jump = true;
    },

    () => {
        keys.jump = false;
    }
);


if (btnAttack) {

    btnAttack.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            attackInArena();

        },
        {
            passive: false
        }
    );

}


if (btnSprint) {

    btnSprint.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            keys.sprint =
                !keys.sprint;

            btnSprint.classList.toggle(
                "active",
                keys.sprint
            );

        },
        {
            passive: false
        }
    );

}


if (canvas) {

    canvas.addEventListener(
        "pointerdown",
        event => {

            if (
                event.pointerType !==
                "mouse"
            ) {

                return;

            }

            attackInArena();

        }
    );

}


// ============================================================
// CHAT
// ============================================================

function appendChatMessage(
    payload
) {

    if (!chatMessages) {
        return;
    }

    const line =
        document.createElement(
            "div"
        );

    line.className =
        "chat-line";

    const usernameElement =
        document.createElement(
            "span"
        );

    usernameElement.className =
        "chat-username";

    usernameElement.textContent =
        payload.username ||
        "Player";

    usernameElement.style.color =
        payload.color ||
        "#888";

    const textElement =
        document.createElement(
            "span"
        );

    textElement.className =
        "chat-text";

    textElement.textContent =
        payload.text ||
        "";

    line.appendChild(
        usernameElement
    );

    line.appendChild(
        document.createTextNode(
            ": "
        )
    );

    line.appendChild(
        textElement
    );

    chatMessages.appendChild(
        line
    );

    while (
        chatMessages.children.length >
        MAX_CHAT_LINES
    ) {

        chatMessages.removeChild(
            chatMessages.firstChild
        );

    }

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


function showChatBubble(
    payload
) {

    if (
        !payload ||
        !payload.id
    ) {

        return;

    }

    chatBubbles[
        String(payload.id)
    ] = {

        text:
            String(
                payload.text || ""
            ).slice(
                0,
                200
            ),

        expiresAt:
            Date.now() +
            CHAT_BUBBLE_DURATION_MS

    };

}


async function sendChatMessage() {

    if (!chatInput) {
        return;
    }

    const text =
        chatInput.value
            .trim()
            .slice(
                0,
                200
            );

    if (!text) {
        return;
    }

    if (
        !gameChannel ||
        !multiplayerConnected
    ) {

        showGameMessage(
            "Multiplayer is connecting...",
            1500
        );

        return;

    }

    const payload = {

        id:
            myUserId,

        username:
            myUsername ||
            "Player",

        color:
            myColor ||
            "#888",

        text

    };

    try {

        await gameChannel.send({

            type:
                "broadcast",

            event:
                "chat",

            payload

        });

        appendChatMessage(
            payload
        );

        showChatBubble(
            payload
        );

        chatInput.value =
            "";

    } catch (error) {

        console.error(
            "[CHAT] Failed:",
            error
        );

    }

}


if (
    chatSendButton
) {

    chatSendButton.addEventListener(
        "click",
        sendChatMessage
    );

}


if (
    chatInput
) {

    chatInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendChatMessage();

            }

        }
    );

}


// ============================================================
// COLLISION
// ============================================================

function rectsOverlap(
    a,
    b
) {

    return (
        a.x <
        b.x + b.width &&

        a.x + a.width >
        b.x &&

        a.y <
        b.y + b.height &&

        a.y + a.height >
        b.y
    );

}


// ============================================================
// PLATFORM HELPERS
// ============================================================

function getCurrentObbyLevel() {

    return (
        obbyLevels[
            currentObbyLevel
        ] ||
        obbyLevels[0]
    );

}


function getPlatforms() {

    if (
        currentPlace ===
        "obby"
    ) {

        return getCurrentObbyLevel()
            .platforms;

    }

    if (
        currentPlace ===
        "arena"
    ) {

        return arenaPlatforms;

    }

    return normalPlatforms;

}


function getSpawnPoint() {

    if (
        currentPlace ===
        "obby"
    ) {

        return getCurrentObbyLevel()
            .spawn;

    }

    if (
        currentPlace ===
        "arena"
    ) {

        return {
            x: 440,
            y: 350
        };

    }

    return {
        x: 50,
        y: 350
    };

}


// ============================================================
// OBBY STATE
// ============================================================

let currentObbyLevel = 0;

if (currentPlace === "obby") {

    const requestedLevel =
        parseInt(
            params.get("level"),
            10
        );

    if (
        Number.isFinite(requestedLevel) &&
        requestedLevel >= 1 &&
        requestedLevel <= obbyLevels.length
    ) {

        currentObbyLevel =
            requestedLevel - 1;

    }

}

let obbyCheckpoint = {
    x: 25,
    y: 350
};

let levelTransitioning =
    false;

let deathInProgress =
    false;


// ============================================================
// ARENA HEALTH
// ============================================================

function resetArenaHealth() {

    arenaHealth =
        ARENA_MAX_HEALTH;

    arenaDeathInProgress =
        false;

}


function damageArenaPlayer(
    amount
) {

    if (
        currentPlace !==
        "arena" ||
        arenaDeathInProgress
    ) {

        return;

    }

    arenaHealth =
        Math.max(
            0,
            arenaHealth -
            amount
        );

    if (
        arenaHealth <= 0
    ) {

        dieInArena();

    }

}


function dieInArena() {

    if (
        arenaDeathInProgress
    ) {

        return;

    }

    arenaDeathInProgress =
        true;

    showGameMessage(
        "💀 YOU DIED!",
        2000
    );

    setTimeout(
        () => {

            resetArenaHealth();

            const spawn =
                getSpawnPoint();

            me.x =
                spawn.x;

            me.y =
                spawn.y;

            me.vx =
                0;

            me.vy =
                0;

        },
        2000
    );

}


// ============================================================
// ATTACK
// ============================================================

function attackInArena() {

    if (
        currentPlace !==
        "arena"
    ) {

        return;

    }

    const now =
        Date.now();

    if (
        now -
        lastArenaAttack <
        ARENA_ATTACK_COOLDOWN_MS
    ) {

        return;

    }

    if (
        arenaDeathInProgress
    ) {

        return;

    }

    lastArenaAttack =
        now;

    arenaAttackUntil =
        now +
        ARENA_ATTACK_ANIMATION_MS;

    const direction =
        me.facing ===
        "left"
            ? -1
            : 1;

    Object.entries(
        remotePlayers
    ).forEach(
        ([id, player]) => {

            if (
                player.health <=
                0
            ) {

                return;

            }

            const playerCenter =
                player.x +
                PLAYER_WIDTH / 2;

            const myCenter =
                me.x +
                PLAYER_WIDTH / 2;

            const horizontalDistance =
                (
                    playerCenter -
                    myCenter
                ) *
                direction;

            const verticalDistance =
                Math.abs(
                    player.y -
                    me.y
                );

            if (
                horizontalDistance >=
                -10 &&
                horizontalDistance <=
                ARENA_ATTACK_RANGE &&
                verticalDistance <=
                45
            ) {

                gameChannel.send({

                    type:
                        "broadcast",

                    event:
                        "damage",

                    payload: {

                        target:
                            id,

                        amount:
                            ARENA_DAMAGE,

                        attacker:
                            myUserId

                    }

                });

            }

        }
    );

}


// ============================================================
// OBBY CHECKPOINT
// ============================================================

function resetObbyCheckpoint() {

    const level =
        getCurrentObbyLevel();

    obbyCheckpoint = {
        x: level.checkpoint.x,
        y: level.checkpoint.y
    };

}


function checkObbyCheckpoint() {

    if (
        currentPlace !==
        "obby"
    ) {

        return;

    }

    const level =
        getCurrentObbyLevel();

    const checkpoint =
        level.checkpoint;

    if (
        Math.abs(
            me.x -
            checkpoint.x
        ) < 35 &&
        Math.abs(
            me.y -
            checkpoint.y
        ) < 45
    ) {

        obbyCheckpoint = {

            x:
                checkpoint.x,

            y:
                checkpoint.y

        };

    }

}


function checkObbyFinish() {

    if (
        currentPlace !==
        "obby"
    ) {

        return;

    }

    const level =
        getCurrentObbyLevel();

    if (
        me.x +
        PLAYER_WIDTH >=
        level.finishX
    ) {

        if (
            levelTransitioning
        ) {

            return;

        }

        levelTransitioning =
            true;

        if (
            currentObbyLevel <
            obbyLevels.length - 1
        ) {

            currentObbyLevel++;

            resetObbyCheckpoint();

            updateUrlState();

            const spawn =
                getSpawnPoint();

            me.x =
                spawn.x;

            me.y =
                spawn.y;

            me.vx =
                0;

            me.vy =
                0;

            if (
                obbyLevelLabel
            ) {

                obbyLevelLabel.textContent =
                    `Level ${currentObbyLevel + 1}`;

            }

            setTimeout(
                () => {

                    levelTransitioning =
                        false;

                },
                500
            );

            joinGame();

        } else {

            showGameMessage(
                "🏆 YOU BEAT THE OBBY!",
                3000
            );

            currentObbyLevel =
                0;

            resetObbyCheckpoint();

            updateUrlState();

            if (
                obbyLevelLabel
            ) {

                obbyLevelLabel.textContent =
                    `Level ${currentObbyLevel + 1}`;

            }

            const spawn =
                getSpawnPoint();

            me.x =
                spawn.x;

            me.y =
                spawn.y;

            me.vx =
                0;

            me.vy =
                0;

            setTimeout(
                () => {

                    levelTransitioning =
                        false;

                },
                500
            );

            joinGame();

        }

    }

}


function checkKillBricks() {

    if (
        currentPlace !==
        "obby"
    ) {

        return false;

    }

    const level =
        getCurrentObbyLevel();

    if (
        !level.killBricks
    ) {

        return false;

    }

    const playerRect = {

        x:
            me.x,

        y:
            me.y,

        width:
            PLAYER_WIDTH,

        height:
            PLAYER_HEIGHT

    };

    return level.killBricks.some(
        brick =>
            rectsOverlap(
                playerRect,
                brick
            )
    );

}


function dieInObby() {

    if (
        deathInProgress
    ) {

        return;

    }

    deathInProgress =
        true;

    showGameMessage(
        "💀 YOU DIED!",
        1500
    );

    setTimeout(
        () => {

            me.x =
                obbyCheckpoint.x;

            me.y =
                obbyCheckpoint.y;

            me.vx =
                0;

            me.vy =
                0;

            deathInProgress =
                false;

        },
        1000
    );

}


// ============================================================
// PHYSICS
// ============================================================

function updatePhysics() {

    if (
        deathInProgress ||
        arenaDeathInProgress
    ) {

        return;

    }

    let moveDirection =
        0;

    if (keys.left) {
        moveDirection--;
    }

    if (keys.right) {
        moveDirection++;
    }

    if (
        moveDirection !==
        0
    ) {

        me.facing =
            moveDirection < 0
                ? "left"
                : "right";

    }

    const speed =
        MOVE_SPEED *
        (
            keys.sprint
                ? SPRINT_MULTIPLIER
                : 1
        );

    me.vx =
        moveDirection *
        speed;

    me.x +=
        me.vx;

    if (
        me.x < 0
    ) {

        me.x = 0;

    }

    if (
        me.x >
        WORLD_WIDTH -
        PLAYER_WIDTH
    ) {

        me.x =
            WORLD_WIDTH -
            PLAYER_WIDTH;

    }

    me.vy +=
        GRAVITY;

    if (
        me.vy >
        MAX_FALL_SPEED
    ) {

        me.vy =
            MAX_FALL_SPEED;

    }

    const oldY =
        me.y;

    me.y +=
        me.vy;

    me.onGround =
        false;

    const playerRect = {

        x:
            me.x,

        y:
            me.y,

        width:
            PLAYER_WIDTH,

        height:
            PLAYER_HEIGHT

    };

    getPlatforms().forEach(
        platform => {

            const wasAbove =
                oldY +
                PLAYER_HEIGHT <=
                platform.y;

            const isFalling =
                me.vy >= 0;

            const overlapsX =
                me.x +
                PLAYER_WIDTH >
                platform.x &&
                me.x <
                platform.x +
                platform.width;

            const crossesTop =
                me.y +
                PLAYER_HEIGHT >=
                platform.y &&
                oldY +
                PLAYER_HEIGHT <=
                platform.y;

            if (
                wasAbove &&
                isFalling &&
                overlapsX &&
                crossesTop
            ) {

                me.y =
                    platform.y -
                    PLAYER_HEIGHT;

                me.vy =
                    0;

                me.onGround =
                    true;

            }

        }
    );

    if (
        keys.jump &&
        me.onGround
    ) {

        me.vy =
            JUMP_VELOCITY;

        me.onGround =
            false;

        keys.jump =
            false;

    }

    checkObbyCheckpoint();

    if (
        checkKillBricks()
    ) {

        dieInObby();

        return;

    }

    if (
        me.y >
        WORLD_HEIGHT + 50
    ) {

        if (
            currentPlace ===
            "obby"
        ) {

            dieInObby();

            return;

        }

        const spawn =
            getSpawnPoint();

        me.x =
            spawn.x;

        me.y =
            spawn.y;

        me.vx =
            0;

        me.vy =
            0;

    }

    checkObbyFinish();

}


// ============================================================
// REMOTE PLAYERS
// ============================================================

function createRemotePlayer(
    id
) {

    return {

        id:
            String(id),

        x:
            50,

        y:
            350,

        username:
            "Player",

        color:
            "#888",

        facing:
            "right",

        level:
            0,

        health:
            ARENA_MAX_HEALTH,

        lastUpdate:
            Date.now()

    };

}


function getRemotePlayer(
    id
) {

    const key =
        String(id);

    if (
        !remotePlayers[key]
    ) {

        remotePlayers[key] =
            createRemotePlayer(
                key
            );

    }

    return remotePlayers[key];

}


// ============================================================
// POSITION BROADCAST
// ============================================================

async function broadcastPosition() {

    if (
        !gameChannel ||
        !myUserId ||
        !multiplayerConnected
    ) {

        return;

    }

    try {

        await gameChannel.send({

            type:
                "broadcast",

            event:
                "pos",

            payload: {

                id:
                    String(
                        myUserId
                    ),

                x:
                    Number(
                        me.x
                    ),

                y:
                    Number(
                        me.y
                    ),

                vx:
                    Number(
                        me.vx
                    ),

                vy:
                    Number(
                        me.vy
                    ),

                facing:
                    me.facing,

                username:
                    myUsername,

                color:
                    myColor,

                level:
                    currentObbyLevel,

                health:
                    currentPlace ===
                    "arena"
                        ? arenaHealth
                        : ARENA_MAX_HEALTH,

                place:
                    currentPlace,

                timestamp:
                    Date.now()

            }

        });

    } catch (error) {

        console.warn(
            "[MULTIPLAYER] Position failed:",
            error
        );

    }

}


// ============================================================
// LEAVE CHANNEL
// ============================================================

async function leaveGameChannel() {

    multiplayerConnected =
        false;

    if (
        gameChannel
    ) {

        const oldChannel =
            gameChannel;

        gameChannel =
            null;

        try {

            await client.removeChannel(
                oldChannel
            );

        } catch (error) {

            console.warn(
                "[MULTIPLAYER] Cleanup failed:",
                error
            );

        }

    }

    Object.keys(
        remotePlayers
    ).forEach(
        id => {

            delete remotePlayers[
                id
            ];

        }
    );

}


// ============================================================
// CHANNEL NAME
// ============================================================

function getChannelName() {

    if (
        currentPlace ===
        "obby"
    ) {

        return `arcade-obby-level-${currentObbyLevel + 1}`;

    }

    return placeInfo[
        currentPlace
    ].channel;

}


// ============================================================
// JOIN CHANNEL
// ============================================================

async function joinGame() {

    if (
        multiplayerJoining ||
        !myUserId
    ) {

        return;

    }

    multiplayerJoining =
        true;

    try {

        await leaveGameChannel();

        const channelName =
            getChannelName();

        const channel =
            client.channel(
                channelName,
                {

                    config: {

                        broadcast: {
                            self: false
                        },

                        presence: {

                            key:
                                String(
                                    myUserId
                                )

                        }

                    }

                }
            );

        gameChannel =
            channel;


        // ====================================================
        // POSITION
        // ====================================================

        channel.on(

            "broadcast",

            {
                event:
                    "pos"
            },

            message => {

                const payload =
                    message?.payload;

                if (
                    !payload ||
                    !payload.id
                ) {

                    return;

                }

                const id =
                    String(
                        payload.id
                    );

                if (
                    id ===
                    String(
                        myUserId
                    )
                ) {

                    return;

                }

                if (
                    payload.place !==
                    currentPlace
                ) {

                    return;

                }

                const player =
                    getRemotePlayer(
                        id
                    );

                if (
                    Number.isFinite(
                        Number(
                            payload.x
                        )
                    )
                ) {

                    player.x =
                        Number(
                            payload.x
                        );

                }

                if (
                    Number.isFinite(
                        Number(
                            payload.y
                        )
                    )
                ) {

                    player.y =
                        Number(
                            payload.y
                        );

                }

                if (
                    payload.username
                ) {

                    player.username =
                        String(
                            payload.username
                        );

                }

                if (
                    payload.color
                ) {

                    player.color =
                        String(
                            payload.color
                        );

                }

                player.facing =
                    payload.facing ===
                    "left"
                        ? "left"
                        : "right";

                player.level =
                    Number(
                        payload.level
                    ) || 0;

                player.health =
                    Number(
                        payload.health
                    );

                player.lastUpdate =
                    Date.now();

            }

        );


        // ====================================================
        // DAMAGE
        // ====================================================

        channel.on(

            "broadcast",

            {
                event:
                    "damage"
            },

            message => {

                const payload =
                    message?.payload;

                if (
                    !payload
                ) {

                    return;

                }

                if (
                    String(
                        payload.target
                    ) ===
                    String(
                        myUserId
                    )
                ) {

                    damageArenaPlayer(
                        Number(
                            payload.amount
                        ) || ARENA_DAMAGE
                    );

                }

            }

        );


        // ====================================================
        // CHAT
        // ====================================================

        channel.on(

            "broadcast",

            {
                event:
                    "chat"
            },

            message => {

                const payload =
                    message?.payload;

                if (
                    !payload
                ) {

                    return;

                }

                appendChatMessage(
                    payload
                );

                showChatBubble(
                    payload
                );

            }

        );


        // ====================================================
        // PRESENCE
        // ====================================================

        channel.on(

            "presence",

            {
                event:
                    "sync"
            },

            () => {

                const state =
                    channel.presenceState();

                Object.keys(
                    remotePlayers
                ).forEach(
                    id => {

                        if (
                            !state[id]
                        ) {

                            delete remotePlayers[
                                id
                            ];

                        }

                    }
                );

            }

        );


        // ====================================================
        // SUBSCRIBE
        // ====================================================

        await new Promise(
            (
                resolve,
                reject
            ) => {

                let finished =
                    false;

                channel.subscribe(
                    async (
                        status,
                        error
                    ) => {

                        console.log(
                            "[MULTIPLAYER]",
                            status
                        );

                        if (
                            status ===
                            "SUBSCRIBED"
                        ) {

                            try {

                                await channel.track({

                                    username:
                                        myUsername,

                                    color:
                                        myColor,

                                    level:
                                        currentObbyLevel,

                                    place:
                                        currentPlace,

                                    joinedAt:
                                        Date.now()

                                });

                                multiplayerConnected =
                                    true;

                                await broadcastPosition();

                                resolve();

                            } catch (
                                err
                            ) {

                                if (
                                    !finished
                                ) {

                                    finished =
                                        true;

                                    reject(
                                        err
                                    );

                                }

                            }

                        }

                        if (
                            status ===
                            "CHANNEL_ERROR" ||
                            status ===
                            "TIMED_OUT"
                        ) {

                            multiplayerConnected =
                                false;

                            if (
                                !finished
                            ) {

                                finished =
                                    true;

                                reject(
                                    error ||
                                    new Error(
                                        status
                                    )
                                );

                            }

                        }

                    }
                );

            }
        );

    } finally {

        multiplayerJoining =
            false;

    }

}


// ============================================================
// PLACE NAVIGATION
// ============================================================

async function goToPlace(
    place
) {

    if (
        !validPlaces.includes(
            place
        )
    ) {

        return;

    }

    if (
        changingPlace ||
        place ===
        currentPlace
    ) {

        return;

    }

    changingPlace =
        true;

    try {

        await leaveGameChannel();

        currentPlace =
            place;

        currentObbyLevel =
            0;

        levelTransitioning =
            false;

        deathInProgress =
            false;

        arenaDeathInProgress =
            false;

        if (
            currentPlace ===
            "arena"
        ) {

            resetArenaHealth();

        }

        if (
            currentPlace ===
            "obby"
        ) {

            resetObbyCheckpoint();

        }

        const spawn =
            getSpawnPoint();

        me.x =
            spawn.x;

        me.y =
            spawn.y;

        me.vx =
            0;

        me.vy =
            0;

        me.onGround =
            false;

        setupPlaceUI();

        updateUrlState();

        if (
            placesMenu
        ) {

            placesMenu.classList.add(
                "hidden"
            );

        }

        await joinGame();

    } catch (
        error
    ) {

        console.error(
            "[PLACE] Failed:",
            error
        );

        multiplayerConnected =
            false;

        showGameMessage(
            "Multiplayer is reconnecting...",
            2000
        );

    } finally {

        changingPlace =
            false;

    }

}


// ============================================================
// PLACE BUTTON
// ============================================================

if (
    placeButton
) {

    placeButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            if (
                currentPlace ===
                "lobby"
            ) {

                if (
                    placesMenu
                ) {

                    placesMenu.classList.toggle(
                        "hidden"
                    );

                }

            } else {

                goToPlace(
                    "lobby"
                );

            }

        }
    );

}


document.querySelectorAll(
    "[data-place]"
).forEach(
    button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                goToPlace(
                    button.dataset.place
                );

            }
        );

    }
);


// ============================================================
// DRAW PLAYER
// ============================================================

function drawPlayer(
    x,
    y,
    color,
    username,
    facing,
    id,
    health,
    sword
) {

    if (!ctx) {
        return;
    }

    // Player body

    ctx.fillStyle =
        color ||
        "#888";

    ctx.beginPath();

    if (
        typeof ctx.roundRect ===
        "function"
    ) {

        ctx.roundRect(
            x,
            y,
            PLAYER_WIDTH,
            PLAYER_HEIGHT,
            6
        );

    } else {

        ctx.rect(
            x,
            y,
            PLAYER_WIDTH,
            PLAYER_HEIGHT
        );

    }

    ctx.fill();


    // Eye

    ctx.fillStyle =
        "rgba(0,0,0,0.65)";

    const eyeX =
        facing === "left"
            ? x + 5
            : x +
              PLAYER_WIDTH -
              9;

    ctx.beginPath();

    ctx.arc(
        eyeX,
        y + 10,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Health bar

    if (
        currentPlace ===
        "arena"
    ) {

        const hp =
            Math.max(
                0,
                Math.min(
                    ARENA_MAX_HEALTH,
                    Number(
                        health
                    ) || 0
                )
            );

        const barWidth =
            50;

        const barHeight =
            7;

        const barX =
            x +
            PLAYER_WIDTH / 2 -
            barWidth / 2;

        const barY =
            y - 21;

        ctx.fillStyle =
            "#151515";

        ctx.fillRect(
            barX,
            barY,
            barWidth,
            barHeight
        );

        ctx.fillStyle =
            hp > 50
                ? "#4ade80"
                : hp > 25
                    ? "#f5d76e"
                    : "#ef4444";

        ctx.fillRect(
            barX,
            barY,
            barWidth *
                (
                    hp /
                    ARENA_MAX_HEALTH
                ),
            barHeight
        );

        ctx.strokeStyle =
            "white";

        ctx.lineWidth =
            1;

        ctx.strokeRect(
            barX,
            barY,
            barWidth,
            barHeight
        );

    }


    // Username

    const safeUsername =
        String(
            username ||
            "Player"
        ).slice(
            0,
            24
        );

    ctx.font =
        "bold 13px Arial";

    ctx.textAlign =
        "center";

    ctx.lineWidth =
        3;

    ctx.strokeStyle =
        "rgba(0,0,0,0.7)";

    ctx.strokeText(
        safeUsername,
        x +
            PLAYER_WIDTH / 2,
        y - 8
    );

    ctx.fillStyle =
        "white";

    ctx.fillText(
        safeUsername,
        x +
            PLAYER_WIDTH / 2,
        y - 8
    );


    // Sword

    if (
        sword &&
        currentPlace ===
        "arena"
    ) {

        const attacking =
            Date.now() <
            arenaAttackUntil;

        const dir =
            facing === "left"
                ? -1
                : 1;

        ctx.save();

        ctx.translate(
            x +
                (
                    dir === 1
                        ? PLAYER_WIDTH
                        : 0
                ),
            y + 20
        );

        const angle =
            attacking
                ? (
                    dir === 1
                        ? -0.95
                        : 0.95
                )
                : (
                    dir === 1
                        ? -0.35
                        : 0.35
                );

        ctx.rotate(
            angle
        );

        // Handle

        ctx.strokeStyle =
            "#8b5a2b";

        ctx.lineWidth =
            5;

        ctx.beginPath();

        ctx.moveTo(
            0,
            0
        );

        ctx.lineTo(
            0,
            15
        );

        ctx.stroke();


        // Blade

        ctx.strokeStyle =
            "#d9e1e8";

        ctx.lineWidth =
            4;

        ctx.beginPath();

        ctx.moveTo(
            0,
            0
        );

        ctx.lineTo(
            dir * 32,
            0
        );

        ctx.stroke();


        // Blade shine

        ctx.strokeStyle =
            "white";

        ctx.lineWidth =
            1;

        ctx.beginPath();

        ctx.moveTo(
            2,
            -1
        );

        ctx.lineTo(
            dir * 30,
            -1
        );

        ctx.stroke();

        ctx.restore();

    }


    // Chat bubble

    const bubble =
        id
            ? chatBubbles[
                String(id)
            ]
            : null;

    if (
        bubble &&
        bubble.expiresAt >
        Date.now()
    ) {

        ctx.font =
            "12px Arial";

        const text =
            bubble.text.length > 28
                ? bubble.text.slice(
                    0,
                    28
                ) + "…"
                : bubble.text;

        const width =
            Math.min(
                ctx.measureText(
                    text
                ).width + 16,
                220
            );

        const bubbleX =
            x +
            PLAYER_WIDTH / 2 -
            width / 2;

        const bubbleY =
            y - 48;

        ctx.fillStyle =
            "white";

        ctx.beginPath();

        if (
            typeof ctx.roundRect ===
            "function"
        ) {

            ctx.roundRect(
                bubbleX,
                bubbleY,
                width,
                22,
                8
            );

        } else {

            ctx.rect(
                bubbleX,
                bubbleY,
                width,
                22
            );

        }

        ctx.fill();

        ctx.fillStyle =
            "#111";

        ctx.textAlign =
            "center";

        ctx.fillText(
            text,
            x +
                PLAYER_WIDTH / 2,
            bubbleY + 15
        );

    }

}


// ============================================================
// CITY DRAWING
// ============================================================

function drawCity() {

    ctx.fillStyle =
        "#202b3a";

    ctx.fillRect(
        0,
        0,
        WORLD_WIDTH,
        WORLD_HEIGHT
    );

    ctx.fillStyle =
        "#f5f3ce";

    ctx.beginPath();

    ctx.arc(
        760,
        80,
        32,
        0,
        Math.PI * 2
    );

    ctx.fill();

    cityBuildings.forEach(
        building => {

            ctx.fillStyle =
                building.color;

            ctx.fillRect(
                building.x,
                building.y,
                building.width,
                building.height
            );

            ctx.fillStyle =
                "#f5d76e";

            for (
                let wx =
                    building.x + 15;

                wx <
                    building.x +
                    building.width -
                    10;

                wx += 28
            ) {

                for (
                    let wy =
                        building.y + 20;

                    wy <
                        building.y +
                        building.height -
                        15;

                    wy += 35
                ) {

                    ctx.fillRect(
                        wx,
                        wy,
                        10,
                        15
                    );

                }

            }

        }
    );

    ctx.fillStyle =
        "#252525";

    ctx.fillRect(
        0,
        370,
        WORLD_WIDTH,
        30
    );

}


// ============================================================
// OBBY FINISH
// ============================================================

function drawObbyFinish() {

    const level =
        getCurrentObbyLevel();

    ctx.fillStyle =
        "#eeeeee";

    ctx.fillRect(
        level.finishX,
        70,
        4,
        95
    );

    ctx.fillStyle =
        "#ffd43b";

    ctx.beginPath();

    ctx.moveTo(
        level.finishX + 4,
        70
    );

    ctx.lineTo(
        level.finishX + 55,
        85
    );

    ctx.lineTo(
        level.finishX + 4,
        100
    );

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle =
        "white";

    ctx.font =
        "bold 12px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "FINISH",
        level.finishX + 25,
        58
    );

}


// ============================================================
// RENDER
// ============================================================

function render() {

    if (!ctx) {
        return;
    }

    ctx.clearRect(
        0,
        0,
        WORLD_WIDTH,
        WORLD_HEIGHT
    );


    // Background

    if (
        currentPlace ===
        "city"
    ) {

        drawCity();

    } else if (
        currentPlace ===
        "arena"
    ) {

        ctx.fillStyle =
            "#241b2f";

        ctx.fillRect(
            0,
            0,
            WORLD_WIDTH,
            WORLD_HEIGHT
        );

        ctx.fillStyle =
            "#3a2947";

        ctx.fillRect(
            0,
            0,
            WORLD_WIDTH,
            90
        );

        ctx.fillStyle =
            "#ffcc33";

        ctx.font =
            "bold 24px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "⚔️ THE ARENA ⚔️",
            WORLD_WIDTH / 2,
            45
        );

        ctx.font =
            "bold 14px Arial";

        ctx.fillStyle =
            "white";

        ctx.fillText(
            "F / ⚔️ TO ATTACK",
            WORLD_WIDTH / 2,
            70
        );

    } else {

        ctx.fillStyle =
            currentPlace ===
            "obby"
                ? "#73b8e8"
                : "#4a90d9";

        ctx.fillRect(
            0,
            0,
            WORLD_WIDTH,
            WORLD_HEIGHT
        );

    }


    // Platforms

    getPlatforms().forEach(
        platform => {

            ctx.fillStyle =
                platform.y ===
                GROUND_Y
                    ? "#3d8b40"
                    : currentPlace ===
                        "arena"
                        ? "#60406f"
                        : currentPlace ===
                            "obby"
                            ? "#9b673b"
                            : "#8a5a34";

            ctx.fillRect(
                platform.x,
                platform.y,
                platform.width,
                platform.height
            );

        }
    );


    // Kill bricks

    if (
        currentPlace ===
        "obby"
    ) {

        const level =
            getCurrentObbyLevel();

        if (
            level.killBricks
        ) {

            level.killBricks.forEach(
                brick => {

                    ctx.fillStyle =
                        "#d93636";

                    ctx.fillRect(
                        brick.x,
                        brick.y,
                        brick.width,
                        brick.height
                    );

                }
            );

        }

        drawObbyFinish();

    }


    // Remote players

    Object.entries(
        remotePlayers
    ).forEach(
        ([id, player]) => {

            drawPlayer(

                player.x,

                player.y,

                player.color,

                player.username,

                player.facing,

                id,

                player.health,

                currentPlace ===
                    "arena" &&
                player.health > 0

            );

        }
    );


    // Local player

    drawPlayer(

        me.x,

        me.y,

        myColor,

        myUsername,

        me.facing,

        myUserId,

        arenaHealth,

        currentPlace ===
            "arena" &&
        arenaHealth > 0

    );


    // Player count

    if (
        playerCountLabel
    ) {

        playerCountLabel.textContent =
            Object.keys(
                remotePlayers
            ).length + 1;

    }

}


// ============================================================
// GAME MESSAGE
// ============================================================

function showGameMessage(
    message,
    duration = 2000
) {

    if (
        !deathMessage
    ) {

        return;

    }

    deathMessage.textContent =
        message;

    deathMessage.style.display =
        "block";

    clearTimeout(
        showGameMessage.timer
    );

    showGameMessage.timer =
        setTimeout(
            () => {

                deathMessage.style.display =
                    "none";

            },
            duration
        );

}


// ============================================================
// PLACE UI
// ============================================================

function setupPlaceUI() {

    if (
        placeTitle
    ) {

        placeTitle.textContent =
            placeInfo[
                currentPlace
            ]?.name ||
            "The Lobby";

    }

    if (
        obbyLevelLabel
    ) {

        if (
            currentPlace ===
            "obby"
        ) {

            obbyLevelLabel.style.display =
                "block";

            obbyLevelLabel.textContent =
                `Level ${currentObbyLevel + 1}`;

        } else {

            obbyLevelLabel.style.display =
                "none";

        }

    }

}


// ============================================================
// URL STATE
// ============================================================

function updateUrlState() {

    const url =
        new URL(
            window.location.href
        );

    url.searchParams.set(
        "place",
        currentPlace
    );

    if (
        currentPlace === "obby"
    ) {

        url.searchParams.set(
            "level",
            String(
                currentObbyLevel + 1
            )
        );

    } else {

        url.searchParams.delete(
            "level"
        );

    }

    window.history.replaceState(
        {},
        "",
        url
    );

}


// ============================================================
// STALE PLAYERS
// ============================================================

function pruneStalePlayers() {

    const now =
        Date.now();

    Object.keys(
        remotePlayers
    ).forEach(
        id => {

            if (
                now -
                remotePlayers[id]
                    .lastUpdate >
                15000
            ) {

                delete remotePlayers[
                    id
                ];

            }

        }
    );

    Object.keys(
        chatBubbles
    ).forEach(
        id => {

            if (
                chatBubbles[id]
                    .expiresAt <
                now
            ) {

                delete chatBubbles[
                    id
                ];

            }

        }
    );

}


setInterval(
    pruneStalePlayers,
    5000
);


// ============================================================
// RECONNECT
// ============================================================

function scheduleReconnect() {

    if (
        reconnectTimer ||
        !myUserId ||
        changingPlace
    ) {

        return;

    }

    reconnectTimer =
        setTimeout(
            async () => {

                reconnectTimer =
                    null;

                if (
                    !myUserId ||
                    changingPlace ||
                    multiplayerConnected
                ) {

                    return;

                }

                try {

                    await joinGame();

                } catch (
                    error
                ) {

                    console.warn(
                        "[MULTIPLAYER] Reconnect failed:",
                        error
                    );

                    scheduleReconnect();

                }

            },
            3000
        );

}


// ============================================================
// GAME LOOP
// ============================================================

let gameLoopStarted =
    false;


function loop() {

    updatePhysics();

    render();

    const now =
        performance.now();

    if (
        gameChannel &&
        myUserId &&
        multiplayerConnected &&
        now -
            lastBroadcast >=
            BROADCAST_INTERVAL_MS
    ) {

        lastBroadcast =
            now;

        broadcastPosition();

    }

    requestAnimationFrame(
        loop
    );

}


function startGameLoop() {

    if (
        gameLoopStarted
    ) {

        return;

    }

    gameLoopStarted =
        true;

    requestAnimationFrame(
        loop
    );

}


// ============================================================
// AUTH
// ============================================================

client.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        console.log(
            "[AUTH] Event:",
            event
        );

        if (
            event ===
            "SIGNED_OUT"
        ) {

            myUserId =
                null;

            multiplayerConnected =
                false;

            await leaveGameChannel();

            if (gameWrap) {

                gameWrap.style.display =
                    "none";

            }

            if (loginNotice) {

                loginNotice.style.display =
                    "block";

            }

            return;

        }

        if (
            (
                event ===
                "SIGNED_IN" ||
                event ===
                "TOKEN_REFRESHED"
            ) &&
            session?.user
        ) {

            if (
                session.access_token
            ) {

                client.realtime.setAuth(
                    session.access_token
                );

            }

        }

    }
);


// ============================================================
// STARTUP
// ============================================================

let startupComplete =
    false;


async function start() {

    if (
        startupComplete
    ) {

        return;

    }

    setupPlaceUI();

    updateUrlState();

    startGameLoop();

    try {

        const {
            data: sessionData,
            error: sessionError
        } =
            await client.auth.getSession();

        if (
            sessionError
        ) {

            throw sessionError;

        }

        const session =
            sessionData?.session ||
            null;

        if (
            session?.access_token
        ) {

            client.realtime.setAuth(
                session.access_token
            );

        }

        let user =
            session?.user ||
            null;

        if (!user) {

            const {
                data: userData
            } =
                await client.auth.getUser();

            user =
                userData?.user ||
                null;

        }

        if (!user) {

            if (gameWrap) {

                gameWrap.style.display =
                    "none";

            }

            if (loginNotice) {

                loginNotice.style.display =
                    "block";

            }

            return;

        }


        // User ID

        myUserId =
            String(
                user.id
            );


        // Profile

        try {

            const {
                data: profile
            } =
                await client
                    .from("profiles")
                    .select(
                        "username"
                    )
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();

            myUsername =
                profile?.username ||
                user.user_metadata?.username ||
                user.user_metadata?.name ||
                user.email ||
                "Player";

        } catch (
            error
        ) {

            console.warn(
                "[PROFILE] Failed:",
                error
            );

            myUsername =
                user.user_metadata?.username ||
                user.user_metadata?.name ||
                user.email ||
                "Player";

        }


        // ====================================================
        // COLOR
        // ====================================================

        const savedColor =
            getSavedPlayerColor();

        myColor =
            savedColor ||
            colorForId(
                myUserId
            );

        updatePlayerColorUI();


        // UI

        if (
            myUsernameLabel
        ) {

            myUsernameLabel.textContent =
                myUsername;

        }

        if (
            loginNotice
        ) {

            loginNotice.style.display =
                "none";

        }

        if (
            gameWrap
        ) {

            gameWrap.style.display =
                "block";

        }


        // Spawn

        if (
            currentPlace ===
            "arena"
        ) {

            resetArenaHealth();

        }

        if (
            currentPlace ===
            "obby"
        ) {

            resetObbyCheckpoint();

        }

        const spawn =
            getSpawnPoint();

        me.x =
            spawn.x;

        me.y =
            spawn.y;

        me.vx =
            0;

        me.vy =
            0;

        me.onGround =
            false;


        // Multiplayer

        try {

            await joinGame();

        } catch (
            error
        ) {

            console.error(
                "[MULTIPLAYER] Initial connection failed:",
                error
            );

            multiplayerConnected =
                false;

            scheduleReconnect();

        }


        startupComplete =
            true;

        console.log(
            "[GAME] Game started."
        );

    } catch (
        error
    ) {

        console.error(
            "[GAME] Startup failed:",
            error
        );

        if (
            myUserId
        ) {

            if (
                gameWrap
            ) {

                gameWrap.style.display =
                    "block";

            }

        } else {

            if (
                gameWrap
            ) {

                gameWrap.style.display =
                    "none";

            }

            if (
                loginNotice
            ) {

                loginNotice.style.display =
                    "block";

                loginNotice.textContent =
                    "Unable to start the game. Please log in again.";

            }

        }

    }

}


// ============================================================
// START
// ============================================================

start();