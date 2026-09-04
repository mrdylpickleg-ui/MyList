// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://kexexqwxcsioigqrkfco.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_gyfnuRePRt7va__Ju4NnSw_OInau_Gz";

const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const IMAGE_BUCKET = "post-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;


// ============================================================
// PUSH NOTIFICATIONS (works even when the site is closed)
// ============================================================

const VAPID_PUBLIC_KEY =
    "BO5i0HcDsM5183Os0iY0NNkFEi6NAiN2l2lRLOahTrnGo2C3vIwUP0RPWGWTWbGca8Z0Qu8Ory83AeGNrcRjfBI";

function urlBase64ToUint8Array(base64String) {

    const padding =
        "=".repeat(
            (4 - (base64String.length % 4)) % 4
        );

    const base64 =
        (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const rawData =
        atob(base64);

    const outputArray =
        new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] =
            rawData.charCodeAt(i);
    }

    return outputArray;
}

async function registerServiceWorker() {

    if (!("serviceWorker" in navigator)) {
        return null;
    }

    try {

        const registration =
            await navigator.serviceWorker.register(
                "sw.js"
            );

        return registration;

    } catch (error) {

        console.error(
            "SERVICE WORKER REGISTER ERROR:",
            error
        );

        return null;
    }
}

async function subscribeToPush() {

    if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
    ) {

        console.warn(
            "Push notifications are not supported in this browser."
        );

        return false;
    }

    const registration =
        await registerServiceWorker();

    if (!registration) {
        return false;
    }

    let subscription =
        await registration.pushManager.getSubscription();

    if (!subscription) {

        try {

            subscription =
                await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey:
                        urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });

        } catch (error) {

            console.error(
                "PUSH SUBSCRIBE ERROR:",
                error
            );

            return false;
        }
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return false;
    }

    const subJson =
        subscription.toJSON();

    const {
        error
    } = await client
        .from("push_subscriptions")
        .upsert(
            [
                {
                    user_id: user.id,
                    endpoint: subJson.endpoint,
                    p256dh: subJson.keys.p256dh,
                    auth: subJson.keys.auth
                }
            ],
            {
                onConflict: "endpoint"
            }
        );

    if (error) {

        console.error(
            "PUSH SUBSCRIPTION SAVE ERROR:",
            error
        );

        return false;
    }

    return true;
}

async function unsubscribeFromPush() {

    if (!("serviceWorker" in navigator)) {
        return;
    }

    const registration =
        await navigator.serviceWorker.getRegistration();

    if (!registration) {
        return;
    }

    const subscription =
        await registration.pushManager.getSubscription();

    if (!subscription) {
        return;
    }

    const endpoint =
        subscription.endpoint;

    await subscription.unsubscribe();

    await client
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);
}

registerServiceWorker();


// ============================================================
// GANG LIST
// ============================================================

const joinButton = document.getElementById("joinButton");
const nameBox = document.getElementById("nameBox");
const nameInput = document.getElementById("nameInput");
const submitButton = document.getElementById("submitButton");
const list = document.getElementById("list");
const message = document.getElementById("message");
const memberCount = document.getElementById("memberCount");


// ============================================================
// ACCOUNT
// ============================================================

const accountSection =
    document.getElementById("accountSection");

const loginButton =
    document.getElementById("loginButton");

const signupButton =
    document.getElementById("signupButton");

const accountBox =
    document.getElementById("accountBox");

const accountName =
    document.getElementById("accountName");

const logoutButton =
    document.getElementById("logoutButton");

const loginBox =
    document.getElementById("loginBox");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const submitLogin =
    document.getElementById("submitLogin");

const loginMessage =
    document.getElementById("loginMessage");

let signupBox = null;
let signupUsername = null;
let signupEmail = null;
let signupPassword = null;
let submitSignup = null;
let signupMessage = null;


// ============================================================
// POSTS
// ============================================================

const postContent =
    document.getElementById("postContent");

const postButton =
    document.getElementById("postButton");

const postMessage =
    document.getElementById("postMessage");

const posts =
    document.getElementById("posts");

const postBox =
    document.getElementById("postBox");

const loginToPost =
    document.getElementById("loginToPost");

const postImage =
    document.getElementById("postImage");

const imagePreview =
    document.getElementById("imagePreview");

const selectedImageName =
    document.getElementById("selectedImageName");

const removeImageButton =
    document.getElementById("removeImageButton");

let postsLoading = false;


// ============================================================
// REQUESTS
// ============================================================

const requestUsername =
    document.getElementById("requestUsername");

const requestInput =
    document.getElementById("requestInput");

const sendRequestButton =
    document.getElementById("sendRequestButton");

const requestMessage =
    document.getElementById("requestMessage");


// ============================================================
// BAD WORD FILTER
// ============================================================

const badWords = [
    "fuck",
    "shit",
    "nigger",
    "nigga",
    "ass",
    "damn",
    "goddamn",
    "dammit",
    "dumbass",
    "fucking",
    "shitty",
    "bitch",
    "dick",
    "boob",
    "boobs",
    "bastard"
];

function containsBadWord(text) {

    const lowerText =
        text.toLowerCase();

    return badWords.some(word =>
        lowerText.includes(
            word.toLowerCase()
        )
    );
}


// ============================================================
// BAN CHECK
// ============================================================

async function checkIfBanned() {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return false;
    }

    const {
        data: profile,
        error
    } = await client
        .from("profiles")
        .select("banned_until")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {

        console.error(
            "BAN CHECK ERROR:",
            error
        );

        return false;
    }

    if (
        !profile ||
        !profile.banned_until
    ) {
        return false;
    }

    const bannedUntil =
        new Date(
            profile.banned_until
        );

    if (
        bannedUntil >
        new Date()
    ) {

        const secondsLeft =
            Math.ceil(
                (
                    bannedUntil.getTime() -
                    Date.now()
                ) / 1000
            );

        alert(
            `You are banned from The Gang for another ${secondsLeft} seconds.`
        );

        return true;
    }

    return false;
}


// ============================================================
// LOAD MEMBERS
// ============================================================

// ============================================================
// ADMIN USER ID CACHE (for showing admin badges on posts/replies)
// ============================================================

let adminUserIds = new Set();

async function loadAdminUserIds() {

    const {
        data,
        error
    } = await client.rpc(
        "get_admin_user_ids"
    );

    if (error) {

        console.error(
            "ADMIN ID LOAD ERROR:",
            error
        );

        return;
    }

    adminUserIds =
        new Set(
            (data || []).map(
                row => row.user_id
            )
        );
}


async function loadList() {

    const {
        data,
        error
    } = await client
        .from("entries")
        .select("id, name, author_id")
        .order("id", {
            ascending: true
        });

    if (error) {

        console.error(
            "MEMBER LOAD ERROR:",
            error
        );

        return;
    }

    if (memberCount) {
        memberCount.textContent =
            data.length;
    }

    if (!list) {
        return;
    }

    const onlineIds =
        await loadOnlineUserIds();

    list.innerHTML = "";

    data.forEach(entry => {

        const div =
            document.createElement("div");

        div.className =
            "entry";

        div.innerHTML = `
            <div class="number">
                #${entry.id}
            </div>

            <span class="status-dot"></span>

            <div class="name"></div>
        `;

        div.querySelector(
            ".name"
        ).textContent =
            entry.name;

        const isOnline =
            entry.author_id &&
            onlineIds.has(
                entry.author_id
            );

        const dot =
            div.querySelector(
                ".status-dot"
            );

        dot.classList.toggle(
            "online",
            isOnline
        );

        dot.title =
            isOnline
                ? "Online"
                : "Offline";

        list.appendChild(div);
    });
}


// ============================================================
// ONLINE PRESENCE
// ============================================================

const PRESENCE_HEARTBEAT_MS = 25000;
const ONLINE_THRESHOLD_MS = 60000;
const LIST_REFRESH_MS = 20000;

let presenceHeartbeatTimer = null;

async function loadOnlineUserIds() {

    const {
        data,
        error
    } = await client
        .from("presence")
        .select("user_id, last_seen");

    if (error) {

        console.error(
            "PRESENCE LOAD ERROR:",
            error
        );

        return new Set();
    }

    const onlineIds =
        new Set();

    const now =
        Date.now();

    (data || []).forEach(row => {

        const lastSeen =
            new Date(
                row.last_seen
            ).getTime();

        if (
            now - lastSeen <
            ONLINE_THRESHOLD_MS
        ) {
            onlineIds.add(
                row.user_id
            );
        }
    });

    return onlineIds;
}

async function sendPresenceHeartbeat() {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return;
    }

    const {
        error
    } = await client
        .from("presence")
        .upsert([
            {
                user_id: user.id,
                last_seen: new Date().toISOString()
            }
        ]);

    if (error) {

        console.error(
            "PRESENCE HEARTBEAT ERROR:",
            error
        );
    }
}

function startPresenceHeartbeat() {

    stopPresenceHeartbeat();

    sendPresenceHeartbeat();

    presenceHeartbeatTimer =
        setInterval(
            sendPresenceHeartbeat,
            PRESENCE_HEARTBEAT_MS
        );
}

function stopPresenceHeartbeat() {

    if (presenceHeartbeatTimer) {

        clearInterval(
            presenceHeartbeatTimer
        );

        presenceHeartbeatTimer =
            null;
    }
}

setInterval(
    loadList,
    LIST_REFRESH_MS
);

setInterval(
    loadAdminUserIds,
    60000
);


// ============================================================
// JOIN BUTTON
// ============================================================

if (joinButton) {

    joinButton.onclick =
        async () => {

            if (
                await checkIfBanned()
            ) {
                return;
            }

            if (nameBox) {
                nameBox.style.display =
                    "none";
            }

            if (message) {
                message.textContent =
                    "";
            }

            const {
                data: { user }
            } = await client.auth.getUser();

            if (!user) {

                if (message) {
                    message.textContent =
                        "You need to log in first.";
                }

                return;
            }

            await joinList();
        };
}


// ============================================================
// JOIN SUBMIT
// ============================================================

if (submitButton) {
    submitButton.onclick =
        joinList;
}

if (nameInput) {

    nameInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {
                joinList();
            }

        }
    );
}


// ============================================================
// JOIN FUNCTION
// ============================================================

async function joinList() {

    if (
        await checkIfBanned()
    ) {
        return;
    }

    if (nameBox) {
        nameBox.style.display =
            "none";
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        if (message) {
            message.textContent =
                "You need to log in first.";
        }

        return;
    }

    const {
        data: profile,
        error: profileError
    } = await client
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {

        console.error(
            "PROFILE ERROR:",
            profileError
        );

        if (message) {
            message.textContent =
                "Profile error: " +
                profileError.message;
        }

        return;
    }

    if (!profile) {

        if (message) {
            message.textContent =
                "Could not find your profile.";
        }

        return;
    }

    const {
        data: existingEntry,
        error: checkError
    } = await client
        .from("entries")
        .select("id")
        .eq("author_id", user.id)
        .maybeSingle();

    if (checkError) {

        console.error(
            "MEMBERSHIP CHECK ERROR:",
            checkError
        );

        if (message) {
            message.textContent =
                "Membership error: " +
                checkError.message;
        }

        return;
    }

    if (existingEntry) {

        if (message) {
            message.textContent =
                "You're already in the Gang!";
        }

        return;
    }

    if (joinButton) {
        joinButton.disabled =
            true;
    }

    if (message) {
        message.textContent =
            "Joining...";
    }

    const {
        data,
        error
    } = await client
        .from("entries")
        .insert([
            {
                name: profile.username,
                author_id: user.id
            }
        ])
        .select("id, name")
        .single();

    if (joinButton) {
        joinButton.disabled =
            false;
    }

    if (error) {

        console.error(
            "JOIN ERROR:",
            error
        );

        if (message) {
            message.textContent =
                "Join error: " +
                error.message;
        }

        return;
    }

    if (message) {
        message.textContent =
            `🎉 YOU'RE IN! You are member #${data.id}!`;
    }

    await loadList();
}


// ============================================================
// CREATE SIGNUP BOX
// ============================================================

function createSignupBox() {

    if (signupBox) {

        signupBox.style.display =
            "block";

        return;
    }

    signupBox =
        document.createElement("div");

    signupBox.id =
        "signupBox";

    signupBox.innerHTML = `
        <input
            id="signupUsername"
            type="text"
            maxlength="30"
            placeholder="Username"
        >

        <input
            id="signupEmail"
            type="email"
            placeholder="Email"
        >

        <input
            id="signupPassword"
            type="password"
            placeholder="Password"
        >

        <button id="submitSignup">
            SIGN UP
        </button>

        <div id="signupMessage"></div>
    `;

    if (accountSection) {
        accountSection.appendChild(
            signupBox
        );
    }

    signupUsername =
        document.getElementById(
            "signupUsername"
        );

    signupEmail =
        document.getElementById(
            "signupEmail"
        );

    signupPassword =
        document.getElementById(
            "signupPassword"
        );

    submitSignup =
        document.getElementById(
            "submitSignup"
        );

    signupMessage =
        document.getElementById(
            "signupMessage"
        );

    submitSignup.onclick =
        signup;
}


// ============================================================
// SIGNUP BUTTON
// ============================================================

if (signupButton) {

    signupButton.onclick =
        () => {

            createSignupBox();

            if (loginBox) {
                loginBox.style.display =
                    "none";
            }

            signupBox.style.display =
                "block";

            signupUsername.focus();
        };
}


// ============================================================
// LOGIN BUTTON
// ============================================================

if (loginButton) {

    loginButton.onclick =
        () => {

            if (loginBox) {
                loginBox.style.display =
                    "block";
            }

            if (signupBox) {
                signupBox.style.display =
                    "none";
            }

            if (loginMessage) {
                loginMessage.textContent =
                    "";
            }

            if (loginEmail) {
                loginEmail.focus();
            }
        };
}


// ============================================================
// SIGN UP
// ============================================================

async function signup() {

    const username =
        signupUsername.value.trim();

    const email =
        signupEmail.value.trim();

    const password =
        signupPassword.value;

    if (
        !username ||
        !email ||
        !password
    ) {

        signupMessage.textContent =
            "Please fill in everything.";

        return;
    }

    if (
        containsBadWord(username)
    ) {

        signupMessage.textContent =
            "That username contains a blocked word.";

        return;
    }

    submitSignup.disabled =
        true;

    signupMessage.textContent =
        "Creating account...";

    const {
        data,
        error
    } = await client.auth.signUp({

        email: email,

        password: password,

        options: {
            data: {
                username: username
            }
        }

    });

    submitSignup.disabled =
        false;

    if (error) {

        console.error(
            "SIGNUP ERROR:",
            error
        );

        signupMessage.textContent =
            error.message;

        return;
    }

    if (!data.user) {

        signupMessage.textContent =
            "Account could not be created.";

        return;
    }

    if (!data.session) {

        signupMessage.textContent =
            "Account created! Check your email to confirm your account, then log in.";

        signupPassword.value =
            "";

        return;
    }

    const profileCreated =
        await createProfileIfNeeded(
            data.user
        );

    if (!profileCreated) {
        return;
    }

    signupMessage.textContent =
        "Account created successfully!";

    await updateAccountUI();
}


// ============================================================
// CREATE PROFILE
// ============================================================

async function createProfileIfNeeded(user) {

    if (!user) {
        return false;
    }

    const {
        data: existingProfile,
        error: profileCheckError
    } = await client
        .from("profiles")
        .select("id, username")
        .eq("id", user.id)
        .maybeSingle();

    if (profileCheckError) {

        console.error(
            "PROFILE CHECK ERROR:",
            profileCheckError
        );

        return false;
    }

    if (existingProfile) {
        return true;
    }

    const username =
        user.user_metadata?.username;

    if (!username) {

        console.error(
            "No username found in Auth metadata."
        );

        return false;
    }

    const {
        error: profileInsertError
    } = await client
        .from("profiles")
        .insert([
            {
                id: user.id,
                username: username
            }
        ]);

    if (profileInsertError) {

        console.error(
            "PROFILE INSERT ERROR:",
            profileInsertError
        );

        return false;
    }

    return true;
}


// ============================================================
// LOGIN
// ============================================================

if (submitLogin) {

    submitLogin.onclick =
        async () => {

            const email =
                loginEmail.value.trim();

            const password =
                loginPassword.value;

            if (
                !email ||
                !password
            ) {

                loginMessage.textContent =
                    "Please enter your email and password.";

                return;
            }

            submitLogin.disabled =
                true;

            loginMessage.textContent =
                "Logging in...";

            const {
                data,
                error
            } = await client.auth.signInWithPassword({

                email: email,

                password: password

            });

            submitLogin.disabled =
                false;

            if (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );

                loginMessage.textContent =
                    error.message;

                return;
            }

            await createProfileIfNeeded(
                data.user
            );

            loginMessage.textContent =
                "Logged in!";

            loginBox.style.display =
                "none";

            await updateAccountUI();
            await loadPosts();
            await loadRequests();
            await updateAdminUI();
        };
}


// ============================================================
// LOG OUT
// ============================================================

if (logoutButton) {

    logoutButton.onclick =
        async () => {

            const {
                error
            } =
                await client.auth.signOut();

            if (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                return;
            }

            await updateAccountUI();
            await loadPosts();
            await loadRequests();
            await updateAdminUI();
        };
}


// ============================================================
// POST UI
// ============================================================

function updatePostUI(loggedIn) {

    if (
        !postBox ||
        !loginToPost
    ) {
        return;
    }

    if (loggedIn) {

        postBox.style.display =
            "block";

        loginToPost.style.display =
            "none";

    } else {

        postBox.style.display =
            "none";

        loginToPost.style.display =
            "block";
    }
}


// ============================================================
// ACCOUNT UI
// ============================================================

async function updateAccountUI() {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        if (loginButton) {
            loginButton.style.display =
                "inline-block";
        }

        if (signupButton) {
            signupButton.style.display =
                "inline-block";
        }

        if (accountBox) {
            accountBox.style.display =
                "none";
        }

        if (loginBox) {
            loginBox.style.display =
                "none";
        }

        if (signupBox) {
            signupBox.style.display =
                "none";
        }

        updatePostUI(false);
        updateDmUI(false);
        stopPresenceHeartbeat();
        stopNotificationPolling();
        closeNotifPanel();
        updateNotifBadge(0);

        return;
    }

    if (loginButton) {
        loginButton.style.display =
            "none";
    }

    if (signupButton) {
        signupButton.style.display =
            "none";
    }

    if (accountBox) {
        accountBox.style.display =
            "block";
    }

    const {
        data: profile
    } = await client
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

    if (accountName) {

        if (profile) {

            accountName.textContent =
                `👋 ${profile.username}`;

        } else {

            accountName.textContent =
                "Logged in!";
        }
    }

    updatePostUI(true);
    updateDmUI(true);
    startPresenceHeartbeat();
    startNotificationPolling();
}


// ============================================================
// AUTH STATE
// ============================================================

client.auth.onAuthStateChange(
    async (event, session) => {

        if (
            event === "SIGNED_IN" &&
            session
        ) {

            await createProfileIfNeeded(
                session.user
            );

            await updateAccountUI();
            await loadPosts();
            await loadRequests();
            await updateAdminUI();
        }

        if (
            event === "SIGNED_OUT"
        ) {

            await updateAccountUI();
            await loadPosts();
            await loadRequests();
            await updateAdminUI();
        }
    }
);


// ============================================================
// IMAGE PICKER
// ============================================================

function clearSelectedImage() {

    if (postImage) {
        postImage.value = "";
    }

    if (imagePreview) {
        imagePreview.src = "";
        imagePreview.style.display =
            "none";
    }

    if (selectedImageName) {
        selectedImageName.textContent =
            "";
    }

    if (removeImageButton) {
        removeImageButton.style.display =
            "none";
    }
}


if (postImage) {

    postImage.addEventListener(
        "change",
        () => {

            const file =
                postImage.files?.[0];

            if (!file) {
                clearSelectedImage();
                return;
            }

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp"
            ];

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                alert(
                    "Please select a JPG, PNG, GIF, or WEBP image."
                );

                clearSelectedImage();
                return;
            }

            if (
                file.size >
                MAX_IMAGE_SIZE
            ) {

                alert(
                    "That image is too large. Maximum size is 5 MB."
                );

                clearSelectedImage();
                return;
            }

            selectedImageName.textContent =
                file.name;

            const previewURL =
                URL.createObjectURL(
                    file
                );

            imagePreview.src =
                previewURL;

            imagePreview.style.display =
                "block";

            removeImageButton.style.display =
                "inline-block";
        }
    );
}


if (removeImageButton) {

    removeImageButton.onclick =
        clearSelectedImage;
}


// ============================================================
// UPLOAD POST IMAGE
// ============================================================

async function uploadPostImage(
    file,
    userId
) {

    if (!file) {
        return {
            url: null,
            path: null,
            error: null
        };
    }

    if (
        file.size >
        MAX_IMAGE_SIZE
    ) {

        return {
            url: null,
            path: null,
            error: new Error(
                "Image is larger than 5 MB."
            )
        };
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        return {
            url: null,
            path: null,
            error: new Error(
                "Unsupported image type."
            )
        };
    }

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    const uniqueName =
        `${crypto.randomUUID()}.${extension}`;

    const path =
        `${userId}/${uniqueName}`;

    const {
        error: uploadError
    } = await client
        .storage
        .from(IMAGE_BUCKET)
        .upload(
            path,
            file,
            {
                cacheControl: "3600",
                contentType: file.type,
                upsert: false
            }
        );

    if (uploadError) {

        console.error(
            "IMAGE UPLOAD ERROR:",
            uploadError
        );

        return {
            url: null,
            path,
            error: uploadError
        };
    }

    const {
        data
    } = client
        .storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(path);

    return {
        url: data.publicUrl,
        path,
        error: null
    };
}


// ============================================================
// LOAD POSTS
// ============================================================

async function loadPosts() {

    if (postsLoading) {
        return;
    }

    if (!posts) {
        return;
    }

    postsLoading =
        true;

    try {

        const {
            data,
            error
        } = await client
            .from("posts_test")
            .select(
                "id, username, content, image_url, likes, created_at, author_id"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                "POST LOAD ERROR:",
                error
            );

            return;
        }

        const {
            data: { user }
        } = await client.auth.getUser();

        posts.innerHTML =
            "";

        for (
            const post of data
        ) {

            let liked =
                false;

            if (user) {

                const {
                    data: existingLike,
                    error: likeCheckError
                } = await client
                    .from("post_likes")
                    .select("id")
                    .eq(
                        "post_id",
                        post.id
                    )
                    .eq(
                        "user_id",
                        user.id
                    )
                    .maybeSingle();

                if (
                    !likeCheckError
                ) {
                    liked =
                        !!existingLike;
                }
            }

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "post";

            div.id =
                "post-" +
                post.id;

            div.innerHTML = `
                <div class="post-username"></div>

                <div class="post-content"></div>

                <img
                    class="post-image"
                    style="display:none;"
                    alt="Post image"
                >

                <button class="like-button"></button>

                <button class="reply-button">
                    💬 Reply
                </button>

                <div class="reply-count"></div>

                <div
                    class="reply-box"
                    style="display:none;"
                >
                    <input
                        class="reply-input"
                        type="text"
                        maxlength="500"
                        placeholder="Write a reply..."
                    >

                    <button class="submit-reply">
                        REPLY
                    </button>

                    <div class="reply-message"></div>
                </div>

                <div class="replies"></div>
            `;

            div.querySelector(
                ".post-username"
            ).textContent =
                post.username +
                (
                    adminUserIds.has(post.author_id)
                        ? " 👑 ADMIN"
                        : ""
                );

            div.querySelector(
                ".post-content"
            ).textContent =
                post.content;

            if (
                post.image_url
            ) {

                const image =
                    div.querySelector(
                        ".post-image"
                    );

                image.src =
                    post.image_url;

                image.style.display =
                    "block";
            }

            const likeButton =
                div.querySelector(
                    ".like-button"
                );

            updateLikeButton(
                likeButton,
                liked,
                post.likes || 0
            );

            likeButton.onclick =
                () =>
                    toggleLike(
                        post.id,
                        likeButton
                    );

            const replyButton =
                div.querySelector(
                    ".reply-button"
                );

            const replyBox =
                div.querySelector(
                    ".reply-box"
                );

            const replyInput =
                div.querySelector(
                    ".reply-input"
                );

            replyButton.onclick =
                async () => {

                    const {
                        data: { user }
                    } =
                        await client.auth.getUser();

                    if (!user) {

                        if (
                            postMessage
                        ) {
                            postMessage.textContent =
                                "You need to log in to reply.";
                        }

                        return;
                    }

                    if (
                        replyBox.style.display ===
                        "none"
                    ) {

                        replyBox.style.display =
                            "block";

                        replyInput.focus();

                    } else {

                        replyBox.style.display =
                            "none";
                    }
                };

            const submitReply =
                div.querySelector(
                    ".submit-reply"
                );

            submitReply.onclick =
                () =>
                    createReply(
                        post.id,
                        div
                    );

            replyInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        createReply(
                            post.id,
                            div
                        );
                    }
                }
            );

            await loadReplies(
                post.id,
                div
            );

            posts.appendChild(
                div
            );
        }

    } finally {

        postsLoading =
            false;
    }
}


// ============================================================
// LIKE BUTTON
// ============================================================

function updateLikeButton(
    button,
    liked,
    count
) {

    if (liked) {

        button.innerHTML =
            `💔 Unlike <span class="like-count">${count}</span>`;

    } else {

        button.innerHTML =
            `❤️ Like <span class="like-count">${count}</span>`;
    }
}


// ============================================================
// LIKE / UNLIKE
// ============================================================

async function toggleLike(
    postId,
    button
) {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        if (postMessage) {
            postMessage.textContent =
                "You need to log in to like posts.";
        }

        return;
    }

    if (
        await checkIfBanned()
    ) {
        return;
    }

    if (button.disabled) {
        return;
    }

    button.disabled =
        true;

    const {
        data: post,
        error: postError
    } = await client
        .from("posts_test")
        .select("likes")
        .eq("id", postId)
        .single();

    if (
        postError ||
        !post
    ) {

        console.error(
            "POST CHECK ERROR:",
            postError
        );

        button.disabled =
            false;

        return;
    }

    const {
        data: existingLike,
        error: likeCheckError
    } = await client
        .from("post_likes")
        .select("id")
        .eq(
            "post_id",
            postId
        )
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();

    if (likeCheckError) {

        console.error(
            "LIKE CHECK ERROR:",
            likeCheckError
        );

        button.disabled =
            false;

        return;
    }

    if (existingLike) {

        const {
            error: deleteError
        } = await client
            .from("post_likes")
            .delete()
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                user.id
            );

        if (deleteError) {

            console.error(
                "UNLIKE ERROR:",
                deleteError
            );

            button.disabled =
                false;

            return;
        }

        const currentCount =
            Number(post.likes) ||
            0;

        const newCount =
            Math.max(
                0,
                currentCount - 1
            );

        const {
            error: countError
        } = await client
            .from("posts_test")
            .update({
                likes: newCount
            })
            .eq(
                "id",
                postId
            );

        if (countError) {

            await loadPosts();

            button.disabled =
                false;

            return;
        }

        updateLikeButton(
            button,
            false,
            newCount
        );

        button.disabled =
            false;

        return;
    }

    const {
        error: insertError
    } = await client
        .from("post_likes")
        .insert([
            {
                post_id: postId,
                user_id: user.id
            }
        ]);

    if (insertError) {

        console.error(
            "LIKE INSERT ERROR:",
            insertError
        );

        if (
            insertError.code ===
            "23505"
        ) {
            await loadPosts();
            button.disabled =
                false;
            return;
        }

        button.disabled =
            false;

        return;
    }

    const currentCount =
        Number(post.likes) ||
        0;

    const newCount =
        currentCount + 1;

    const {
        error: countError
    } = await client
        .from("posts_test")
        .update({
            likes: newCount
        })
        .eq(
            "id",
            postId
        );

    if (countError) {

        await loadPosts();

        button.disabled =
            false;

        return;
    }

    updateLikeButton(
        button,
        true,
        newCount
    );

    button.disabled =
        false;
}


// ============================================================
// CREATE POST
// ============================================================

if (postButton) {
    postButton.onclick =
        createPost;
}


async function createPost() {

    if (
        await checkIfBanned()
    ) {
        return;
    }

    const content =
        postContent.value.trim();

    const file =
        postImage?.files?.[0] ||
        null;

    if (
        !content &&
        !file
    ) {

        postMessage.textContent =
            "Write something or choose an image first.";

        return;
    }

    if (
        content &&
        containsBadWord(content)
    ) {

        postMessage.textContent =
            "Your post contains a blocked word.";

        return;
    }

    postButton.disabled =
        true;

    postMessage.textContent =
        "Posting...";

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        postMessage.textContent =
            "You need to be logged in.";

        postButton.disabled =
            false;

        return;
    }

    const profileCreated =
        await createProfileIfNeeded(
            user
        );

    if (!profileCreated) {

        postButton.disabled =
            false;

        postMessage.textContent =
            "Could not create your profile.";

        return;
    }

    const {
        data: profile,
        error: profileError
    } = await client
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

    if (
        profileError ||
        !profile
    ) {

        console.error(
            "PROFILE ERROR:",
            profileError
        );

        postMessage.textContent =
            "Profile error.";

        postButton.disabled =
            false;

        return;
    }

    let imageURL =
        null;

    let imagePath =
        null;

    if (file) {

        postMessage.textContent =
            "Uploading image...";

        const uploadResult =
            await uploadPostImage(
                file,
                user.id
            );

        if (
            uploadResult.error
        ) {

            postMessage.textContent =
                "Image upload failed: " +
                uploadResult.error.message;

            postButton.disabled =
                false;

            return;
        }

        imageURL =
            uploadResult.url;

        imagePath =
            uploadResult.path;
    }

    const {
        error
    } = await client
        .from("posts_test")
        .insert([
            {
                author_id: user.id,
                username: profile.username,
                content: content,
                image_url: imageURL,
                likes: 0
            }
        ]);

    if (error) {

        console.error(
            "POST ERROR:",
            error
        );

        if (
            imagePath
        ) {

            await client
                .storage
                .from(IMAGE_BUCKET)
                .remove([
                    imagePath
                ]);
        }

        postMessage.textContent =
            "Post error: " +
            error.message;

        postButton.disabled =
            false;

        return;
    }

    postContent.value =
        "";

    clearSelectedImage();

    postMessage.textContent =
        "Posted! 🎉";

    postButton.disabled =
        false;

    await loadPosts();
}


// ============================================================
// LOAD POST REPLIES
// ============================================================

async function loadReplies(
    postId,
    postElement
) {

    const repliesContainer =
        postElement.querySelector(
            ".replies"
        );

    const replyCount =
        postElement.querySelector(
            ".reply-count"
        );

    const {
        data,
        error
    } = await client
        .from("post_replies")
        .select(
            "id, author_id, username, content, created_at"
        )
        .eq(
            "post_id",
            postId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "REPLY LOAD ERROR:",
            error
        );

        return;
    }

    repliesContainer.innerHTML =
        "";

    replyCount.textContent =
        data.length === 1
            ? "💬 1 reply"
            : `💬 ${data.length} replies`;

    const {
        data: { user }
    } = await client.auth.getUser();

    data.forEach(
        reply => {

            const replyDiv =
                document.createElement(
                    "div"
                );

            replyDiv.className =
                "reply";

            replyDiv.innerHTML = `
                <div class="reply-username"></div>

                <div class="reply-content"></div>

                <button
                    class="delete-reply"
                    style="display:none;"
                >
                    DELETE
                </button>
            `;

            replyDiv.querySelector(
                ".reply-username"
            ).textContent =
                reply.username +
                (
                    adminUserIds.has(reply.author_id)
                        ? " 👑 ADMIN"
                        : ""
                );

            replyDiv.querySelector(
                ".reply-content"
            ).textContent =
                reply.content;

            const deleteButton =
                replyDiv.querySelector(
                    ".delete-reply"
                );

            if (
                user &&
                user.id ===
                    reply.author_id
            ) {

                deleteButton.style.display =
                    "inline-block";

                deleteButton.onclick =
                    () =>
                        deleteReply(
                            reply.id,
                            postId,
                            postElement
                        );
            }

            repliesContainer.appendChild(
                replyDiv
            );
        }
    );
}


// ============================================================
// CREATE POST REPLY
// ============================================================

async function createReply(
    postId,
    postElement
) {

    if (
        await checkIfBanned()
    ) {
        return;
    }

    const replyInput =
        postElement.querySelector(
            ".reply-input"
        );

    const submitButton =
        postElement.querySelector(
            ".submit-reply"
        );

    const replyMessage =
        postElement.querySelector(
            ".reply-message"
        );

    const content =
        replyInput.value.trim();

    if (!content) {

        replyMessage.textContent =
            "Write something first.";

        return;
    }

    if (
        containsBadWord(content)
    ) {

        replyMessage.textContent =
            "Your reply contains a blocked word.";

        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        replyMessage.textContent =
            "You need to log in.";

        return;
    }

    submitButton.disabled =
        true;

    replyMessage.textContent =
        "Replying...";

    const {
        data: profile,
        error: profileError
    } = await client
        .from("profiles")
        .select("username")
        .eq(
            "id",
            user.id
        )
        .maybeSingle();

    if (
        profileError ||
        !profile
    ) {

        replyMessage.textContent =
            "Could not find your profile.";

        submitButton.disabled =
            false;

        return;
    }

    const {
        error
    } = await client
        .from("post_replies")
        .insert([
            {
                post_id: postId,
                author_id: user.id,
                username: profile.username,
                content: content
            }
        ]);

    if (error) {

        console.error(
            "REPLY ERROR:",
            error
        );

        replyMessage.textContent =
            "Could not create reply: " +
            error.message;

        submitButton.disabled =
            false;

        return;
    }

    replyInput.value =
        "";

    replyMessage.textContent =
        "Reply posted!";

    submitButton.disabled =
        false;

    await loadReplies(
        postId,
        postElement
    );
}


// ============================================================
// DELETE POST REPLY
// ============================================================

async function deleteReply(
    replyId,
    postId,
    postElement
) {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return;
    }

    const {
        error
    } = await client
        .from("post_replies")
        .delete()
        .eq(
            "id",
            replyId
        )
        .eq(
            "author_id",
            user.id
        );

    if (error) {

        console.error(
            "DELETE REPLY ERROR:",
            error
        );

        return;
    }

    await loadReplies(
        postId,
        postElement
    );
}


// ============================================================
// REQUESTS CONTAINER
// ============================================================

let requestsContainer =
    document.getElementById(
        "requests"
    );

if (!requestsContainer) {

    requestsContainer =
        document.createElement(
            "div"
        );

    requestsContainer.id =
        "requests";

    requestsContainer.style.maxWidth =
        "700px";

    requestsContainer.style.margin =
        "30px auto";

    const requestPanel =
        document.getElementById(
            "requestPanel"
        );

    if (
        requestPanel &&
        requestPanel.parentNode
    ) {

        requestPanel.parentNode.insertBefore(
            requestsContainer,
            requestPanel.nextSibling
        );

    } else {

        document.body.appendChild(
            requestsContainer
        );
    }
}


// ============================================================
// SEND REQUEST
// ============================================================

if (sendRequestButton) {
    sendRequestButton.onclick =
        sendRequest;
}


async function sendRequest() {

    if (
        await checkIfBanned()
    ) {
        return;
    }

    const request =
        requestInput.value.trim();

    const username =
        requestUsername.value.trim();

    if (!request) {

        requestMessage.textContent =
            "Write a request first.";

        return;
    }

    if (
        containsBadWord(request)
    ) {

        requestMessage.textContent =
            "Your request contains a blocked word.";

        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        requestMessage.textContent =
            "You need to log in to send a request.";

        return;
    }

    sendRequestButton.disabled =
        true;

    requestMessage.textContent =
        "Sending...";

    const {
        data: profile
    } = await client
        .from("profiles")
        .select("username")
        .eq(
            "id",
            user.id
        )
        .maybeSingle();

    const finalUsername =
        username ||
        profile?.username ||
        "Anonymous";

    const {
        error
    } = await client
        .from("requests")
        .insert([
            {
                user_id: user.id,
                username: finalUsername,
                request: request
            }
        ]);

    sendRequestButton.disabled =
        false;

    if (error) {

        console.error(
            "REQUEST ERROR:",
            error
        );

        requestMessage.textContent =
            "Could not send request: " +
            error.message;

        return;
    }

    requestInput.value =
        "";

    requestMessage.textContent =
        "Request sent! 💡";

    await loadRequests();
}


// ============================================================
// LOAD REQUESTS
// ============================================================

async function loadRequests() {

    if (!requestsContainer) {
        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        requestsContainer.innerHTML = `
            <h2>💡 REQUESTS</h2>
            <p>Log in to view your requests.</p>
        `;

        return;
    }

    const {
        data,
        error
    } = await client
        .from("requests")
        .select(
            "id, user_id, username, request, created_at"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "REQUEST LOAD ERROR:",
            error
        );

        requestsContainer.innerHTML = `
            <h2>💡 REQUESTS</h2>
            <p>Could not load requests.</p>
        `;

        return;
    }

    requestsContainer.innerHTML =
        `
        <h2>💡 REQUESTS</h2>
        `;

    if (
        !data ||
        data.length === 0
    ) {

        requestsContainer.innerHTML +=
            "<p>No requests yet.</p>";

        return;
    }

    for (
        const request of data
    ) {

        const requestDiv =
            document.createElement(
                "div"
            );

        requestDiv.className =
            "request";

        requestDiv.id =
            "request-" +
            request.id;

        requestDiv.style.border =
            "1px solid #333";

        requestDiv.style.borderRadius =
            "8px";

        requestDiv.style.padding =
            "12px";

        requestDiv.style.marginBottom =
            "12px";

        requestDiv.style.background =
            "#1b1b1b";

        requestDiv.innerHTML = `
            <div class="request-username"></div>

            <div class="request-content"></div>

            <button class="request-reply-button">
                💬 Reply
            </button>

            <div
                class="request-reply-box"
                style="display:none;"
            >
                <input
                    class="request-reply-input"
                    type="text"
                    maxlength="500"
                    placeholder="Write a reply..."
                >

                <button class="submit-request-reply">
                    SEND REPLY
                </button>

                <div class="request-reply-message"></div>
            </div>

            <div class="request-replies"></div>
        `;

        requestDiv.querySelector(
            ".request-username"
        ).textContent =
            `👤 ${request.username}`;

        requestDiv.querySelector(
            ".request-content"
        ).textContent =
            request.request;

        const replyButton =
            requestDiv.querySelector(
                ".request-reply-button"
            );

        const replyBox =
            requestDiv.querySelector(
                ".request-reply-box"
            );

        const replyInput =
            requestDiv.querySelector(
                ".request-reply-input"
            );

        replyButton.onclick =
            async () => {

                if (
                    await checkIfBanned()
                ) {
                    return;
                }

                const {
                    data: { user }
                } =
                    await client.auth.getUser();

                if (!user) {
                    return;
                }

                if (
                    replyBox.style.display ===
                    "none"
                ) {

                    replyBox.style.display =
                        "block";

                    replyInput.focus();

                } else {

                    replyBox.style.display =
                        "none";
                }
            };

        const submitRequestReply =
            requestDiv.querySelector(
                ".submit-request-reply"
            );

        submitRequestReply.onclick =
            () =>
                createRequestReply(
                    request.id,
                    requestDiv
                );

        replyInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    createRequestReply(
                        request.id,
                        requestDiv
                    );
                }
            }
        );

        await loadRequestReplies(
            request.id,
            requestDiv
        );

        requestsContainer.appendChild(
            requestDiv
        );
    }
}


// ============================================================
// LOAD REQUEST REPLIES
// ============================================================

async function loadRequestReplies(
    requestId,
    requestElement
) {

    const repliesContainer =
        requestElement.querySelector(
            ".request-replies"
        );

    const {
        data,
        error
    } = await client
        .from("request_replies")
        .select(
            "id, request_id, user_id, username, content, created_at"
        )
        .eq(
            "request_id",
            requestId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "REQUEST REPLY LOAD ERROR:",
            error
        );

        return;
    }

    repliesContainer.innerHTML =
        "";

    const {
        data: { user }
    } = await client.auth.getUser();

    data.forEach(
        reply => {

            const replyDiv =
                document.createElement(
                    "div"
                );

            replyDiv.className =
                "request-reply";

            replyDiv.style.marginTop =
                "8px";

            replyDiv.style.marginLeft =
                "20px";

            replyDiv.style.padding =
                "8px";

            replyDiv.style.borderLeft =
                "3px solid #888";

            replyDiv.innerHTML = `
                <div class="request-reply-username"></div>

                <div class="request-reply-content"></div>

                <button
                    class="delete-request-reply"
                    style="display:none;"
                >
                    DELETE
                </button>
            `;

            replyDiv.querySelector(
                ".request-reply-username"
            ).textContent =
                `👤 ${reply.username}`;

            replyDiv.querySelector(
                ".request-reply-content"
            ).textContent =
                reply.content;

            const deleteButton =
                replyDiv.querySelector(
                    ".delete-request-reply"
                );

            if (
                user &&
                user.id ===
                    reply.user_id
            ) {

                deleteButton.style.display =
                    "inline-block";

                deleteButton.onclick =
                    () =>
                        deleteRequestReply(
                            reply.id,
                            requestId,
                            requestElement
                        );
            }

            repliesContainer.appendChild(
                replyDiv
            );
        }
    );
}


// ============================================================
// CREATE REQUEST REPLY
// ============================================================

async function createRequestReply(
    requestId,
    requestElement
) {

    if (
        await checkIfBanned()
    ) {
        return;
    }

    const replyInput =
        requestElement.querySelector(
            ".request-reply-input"
        );

    const submitButton =
        requestElement.querySelector(
            ".submit-request-reply"
        );

    const replyMessage =
        requestElement.querySelector(
            ".request-reply-message"
        );

    const content =
        replyInput.value.trim();

    if (!content) {

        replyMessage.textContent =
            "Write something first.";

        return;
    }

    if (
        containsBadWord(content)
    ) {

        replyMessage.textContent =
            "Your reply contains a blocked word.";

        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        replyMessage.textContent =
            "You need to log in.";

        return;
    }

    submitButton.disabled =
        true;

    replyMessage.textContent =
        "Sending...";

    const {
        data: profile,
        error: profileError
    } = await client
        .from("profiles")
        .select("username")
        .eq(
            "id",
            user.id
        )
        .maybeSingle();

    if (
        profileError ||
        !profile
    ) {

        console.error(
            "REQUEST REPLY PROFILE ERROR:",
            profileError
        );

        replyMessage.textContent =
            "Could not find your profile.";

        submitButton.disabled =
            false;

        return;
    }

    const {
        error
    } = await client
        .from("request_replies")
        .insert([
            {
                request_id: requestId,
                user_id: user.id,
                username: profile.username,
                content: content
            }
        ]);

    if (error) {

        console.error(
            "REQUEST REPLY ERROR:",
            error
        );

        replyMessage.textContent =
            "Could not send reply: " +
            error.message;

        submitButton.disabled =
            false;

        return;
    }

    replyInput.value =
        "";

    replyMessage.textContent =
        "Reply sent! 💬";

    submitButton.disabled =
        false;

    await loadRequestReplies(
        requestId,
        requestElement
    );
}


// ============================================================
// DELETE REQUEST REPLY
// ============================================================

async function deleteRequestReply(
    replyId,
    requestId,
    requestElement
) {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return;
    }

    const {
        error
    } = await client
        .from("request_replies")
        .delete()
        .eq(
            "id",
            replyId
        )
        .eq(
            "user_id",
            user.id
        );

    if (error) {

        console.error(
            "DELETE REQUEST REPLY ERROR:",
            error
        );

        return;
    }

    await loadRequestReplies(
        requestId,
        requestElement
    );
}


// ============================================================
// ADMIN PANEL
// ============================================================

let adminPanel = null;
let adminContent = null;
let currentUserIsAdmin = false;


// ============================================================
// CHECK ADMIN
// ============================================================

async function checkAdmin() {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        currentUserIsAdmin =
            false;

        return false;
    }

    const {
        data,
        error
    } = await client.rpc(
        "is_admin"
    );

    if (error) {

        console.error(
            "ADMIN CHECK ERROR:",
            error
        );

        currentUserIsAdmin =
            false;

        return false;
    }

    currentUserIsAdmin =
        data === true;

    return currentUserIsAdmin;
}


// ============================================================
// CREATE ADMIN PANEL
// ============================================================

function createAdminPanel() {

    if (adminPanel) {
        return;
    }

    adminPanel =
        document.createElement(
            "div"
        );

    adminPanel.id =
        "adminPanel";

    adminPanel.style.display =
        "none";

    adminPanel.innerHTML = `
        <div id="adminPanelInner">

            <div class="admin-title">
                🔐 ADMIN PANEL
            </div>

            <div class="admin-subtitle">
                THE GANG
            </div>

            <div class="admin-stats">

                <div class="admin-stat">
                    <div
                        class="admin-stat-number"
                        id="adminMemberCount"
                    >
                        0
                    </div>

                    <div class="admin-stat-label">
                        👥 Members
                    </div>
                </div>

                <div class="admin-stat">
                    <div
                        class="admin-stat-number"
                        id="adminPostCount"
                    >
                        0
                    </div>

                    <div class="admin-stat-label">
                        📝 Posts
                    </div>
                </div>

                <div class="admin-stat">
                    <div
                        class="admin-stat-number"
                        id="adminRequestCount"
                    >
                        0
                    </div>

                    <div class="admin-stat-label">
                        💡 Requests
                    </div>
                </div>

            </div>

            <div class="admin-buttons">

                <button id="adminPostsButton">
                    📝 Manage Posts
                </button>

                <button id="adminRequestsButton">
                    💡 Manage Requests
                </button>

                <button id="adminMembersButton">
                    👥 Manage Members
                </button>

                <button id="adminAccountsButton">
                    👤 Manage Accounts
                </button>

                <button id="adminDmsButton">
                    💬 Manage Direct Messages
                </button>

            </div>

            <div id="adminContent"></div>

        </div>
    `;

    document.body.appendChild(
        adminPanel
    );

    adminContent =
        document.getElementById(
            "adminContent"
        );

    document
        .getElementById(
            "adminPostsButton"
        )
        .onclick =
        loadAdminPosts;

    document
        .getElementById(
            "adminRequestsButton"
        )
        .onclick =
        loadAdminRequests;

    document
        .getElementById(
            "adminMembersButton"
        )
        .onclick =
        loadAdminMembers;

    document
        .getElementById(
            "adminAccountsButton"
        )
        .onclick =
        loadAdminAccounts;

    document
        .getElementById(
            "adminDmsButton"
        )
        .onclick =
        loadAdminConversations;
}


// ============================================================
// UPDATE ADMIN UI
// ============================================================

async function updateAdminUI() {

    const isAdmin =
        await checkAdmin();

    createAdminPanel();

    if (!isAdmin) {

        adminPanel.style.display =
            "none";

        return;
    }

    adminPanel.style.display =
        "block";

    await loadAdminStats();
}


// ============================================================
// ADMIN STATS
// ============================================================

async function loadAdminStats() {

    if (!currentUserIsAdmin) {
        return;
    }

    const {
        count: memberCountValue,
        error: memberError
    } = await client
        .from("entries")
        .select("*", {
            count: "exact",
            head: true
        });

    const {
        count: postCount,
        error: postError
    } = await client
        .from("posts_test")
        .select("*", {
            count: "exact",
            head: true
        });

    const {
        count: requestCount,
        error: requestError
    } = await client
        .from("requests")
        .select("*", {
            count: "exact",
            head: true
        });

    if (memberError) {
        console.error(
            "ADMIN MEMBER COUNT ERROR:",
            memberError
        );
    }

    if (postError) {
        console.error(
            "ADMIN POST COUNT ERROR:",
            postError
        );
    }

    if (requestError) {
        console.error(
            "ADMIN REQUEST COUNT ERROR:",
            requestError
        );
    }

    const memberCounter =
        document.getElementById(
            "adminMemberCount"
        );

    const postCounter =
        document.getElementById(
            "adminPostCount"
        );

    const requestCounter =
        document.getElementById(
            "adminRequestCount"
        );

    if (memberCounter) {
        memberCounter.textContent =
            memberCountValue ?? 0;
    }

    if (postCounter) {
        postCounter.textContent =
            postCount ?? 0;
    }

    if (requestCounter) {
        requestCounter.textContent =
            requestCount ?? 0;
    }
}


// ============================================================
// ADMIN POSTS
// ============================================================

async function loadAdminPosts() {

    if (!currentUserIsAdmin) {
        return;
    }

    adminContent.innerHTML =
        "<h3>📝 POSTS</h3><p>Loading...</p>";

    const {
        data,
        error
    } = await client
        .from("posts_test")
        .select(
            "id, username, content, image_url, likes, created_at, author_id"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        adminContent.innerHTML =
            `<p>Could not load posts: ${error.message}</p>`;

        return;
    }

    adminContent.innerHTML =
        "<h3>📝 POSTS</h3>";

    if (
        !data ||
        data.length === 0
    ) {

        adminContent.innerHTML +=
            "<p>No posts.</p>";

        return;
    }

    data.forEach(
        post => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "admin-item";

            item.innerHTML = `
                <div class="admin-item-top">

                    <strong></strong>

                    <button class="admin-delete">
                        🗑️ DELETE
                    </button>

                </div>

                <div class="admin-item-content"></div>

                <img
                    class="admin-image"
                    style="display:none;"
                    alt="Post image"
                >

                <div class="admin-item-info"></div>
            `;

            item.querySelector(
                "strong"
            ).textContent =
                "👤 " +
                post.username;

            item.querySelector(
                ".admin-item-content"
            ).textContent =
                post.content;

            if (
                post.image_url
            ) {

                const image =
                    item.querySelector(
                        ".admin-image"
                    );

                image.src =
                    post.image_url;

                image.style.display =
                    "block";
            }

            item.querySelector(
                ".admin-item-info"
            ).textContent =
                `❤️ ${post.likes || 0} • ID: ${post.id}`;

            item.querySelector(
                ".admin-delete"
            ).onclick =
                async () => {

                    if (
                        !confirm(
                            "Delete this post?"
                        )
                    ) {
                        return;
                    }

                    await adminDeletePost(
                        post.id,
                        post.image_url
                    );
                };

            adminContent.appendChild(
                item
            );
        }
    );
}


// ============================================================
// ADMIN DELETE POST
// ============================================================

async function adminDeletePost(
    postId,
    imageURL
) {

    if (!currentUserIsAdmin) {
        return;
    }

    const {
        error
    } = await client
        .from("posts_test")
        .delete()
        .eq(
            "id",
            postId
        );

    if (error) {

        alert(
            "Could not delete post:\n" +
            error.message
        );

        return;
    }

    if (imageURL) {

        const marker =
            `/post-images/`;

        const index =
            imageURL.indexOf(
                marker
            );

        if (index !== -1) {

            const path =
                imageURL.substring(
                    index +
                    marker.length
                );

            await client
                .storage
                .from(IMAGE_BUCKET)
                .remove([
                    path
                ]);
        }
    }

    await loadAdminPosts();
    await loadAdminStats();
    await loadPosts();
}


// ============================================================
// ADMIN REQUESTS
// ============================================================

async function loadAdminRequests() {

    if (!currentUserIsAdmin) {
        return;
    }

    adminContent.innerHTML =
        "<h3>💡 REQUESTS</h3><p>Loading...</p>";

    const {
        data,
        error
    } = await client
        .from("requests")
        .select(
            "id, user_id, username, request, created_at"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        adminContent.innerHTML =
            `<p>Could not load requests: ${error.message}</p>`;

        return;
    }

    adminContent.innerHTML =
        "<h3>💡 REQUESTS</h3>";

    if (
        !data ||
        data.length === 0
    ) {

        adminContent.innerHTML +=
            "<p>No requests.</p>";

        return;
    }

    data.forEach(
        request => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "admin-item";

            item.innerHTML = `
                <div class="admin-item-top">

                    <strong></strong>

                    <button class="admin-delete">
                        🗑️ DELETE
                    </button>

                </div>

                <div class="admin-item-content"></div>

                <div class="admin-item-info"></div>
            `;

            item.querySelector(
                "strong"
            ).textContent =
                "👤 " +
                request.username;

            item.querySelector(
                ".admin-item-content"
            ).textContent =
                request.request;

            item.querySelector(
                ".admin-item-info"
            ).textContent =
                "Request ID: " +
                request.id;

            item.querySelector(
                ".admin-delete"
            ).onclick =
                async () => {

                    if (
                        !confirm(
                            "Delete this request and its replies?"
                        )
                    ) {
                        return;
                    }

                    await adminDeleteRequest(
                        request.id
                    );
                };

            adminContent.appendChild(
                item
            );
        }
    );
}


// ============================================================
// ADMIN DELETE REQUEST
// ============================================================

async function adminDeleteRequest(
    requestId
) {

    if (!currentUserIsAdmin) {
        return;
    }

    const {
        error
    } = await client
        .from("requests")
        .delete()
        .eq(
            "id",
            requestId
        );

    if (error) {

        alert(
            "Could not delete request:\n" +
            error.message
        );

        return;
    }

    await loadAdminRequests();
    await loadAdminStats();
    await loadRequests();
}


// ============================================================
// ADMIN MEMBERS
// ============================================================

async function loadAdminMembers() {

    if (!currentUserIsAdmin) {
        return;
    }

    adminContent.innerHTML =
        "<h3>👥 MEMBERS</h3><p>Loading...</p>";

    const {
        data,
        error
    } = await client
        .from("entries")
        .select(
            "id, name, author_id"
        )
        .order(
            "id",
            {
                ascending: true
            }
        );

    if (error) {

        adminContent.innerHTML =
            `<p>Could not load members: ${error.message}</p>`;

        return;
    }

    adminContent.innerHTML =
        "<h3>👥 MEMBERS</h3>";

    if (
        !data ||
        data.length === 0
    ) {

        adminContent.innerHTML +=
            "<p>No members.</p>";

        return;
    }

    data.forEach(
        member => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "admin-item";

            item.innerHTML = `
                <div class="admin-item-top">

                    <strong></strong>

                    <div>
                        <button class="admin-ban">
                            🚫 BAN
                        </button>

                        <button class="admin-delete">
                            🗑️ REMOVE
                        </button>
                    </div>

                </div>

                <div class="admin-item-info"></div>
            `;

            item.querySelector(
                "strong"
            ).textContent =
                "#" +
                member.id +
                "  " +
                member.name;

            item.querySelector(
                ".admin-item-info"
            ).textContent =
                "User ID: " +
                member.author_id;

            item.querySelector(
                ".admin-ban"
            ).onclick =
                () =>
                    banAccount(
                        member.author_id,
                        member.name
                    );

            item.querySelector(
                ".admin-delete"
            ).onclick =
                async () => {

                    if (
                        !confirm(
                            "Remove this person from the Gang?"
                        )
                    ) {
                        return;
                    }

                    await adminDeleteMember(
                        member.id
                    );
                };

            adminContent.appendChild(
                item
            );
        }
    );
}


// ============================================================
// ADMIN DELETE MEMBER
// ============================================================

async function adminDeleteMember(
    memberId
) {

    if (!currentUserIsAdmin) {
        return;
    }

    const {
        error
    } = await client
        .from("entries")
        .delete()
        .eq(
            "id",
            memberId
        );

    if (error) {

        alert(
            "Could not remove member:\n" +
            error.message
        );

        return;
    }

    await loadAdminMembers();
    await loadAdminStats();
    await loadList();
}


// ============================================================
// BAN ACCOUNT
// ============================================================

async function banAccount(
    userId,
    username
) {

    if (!currentUserIsAdmin) {

        alert(
            "You are not an admin."
        );

        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        alert(
            "You must be logged in."
        );

        return;
    }

    if (
        user.id === userId
    ) {

        alert(
            "You cannot ban yourself."
        );

        return;
    }

    const seconds =
        Number(
            prompt(
                `How many seconds should ${username} be banned for?`
            )
        );

    if (
        !Number.isFinite(seconds) ||
        seconds <= 0
    ) {

        alert(
            "Enter a valid number of seconds."
        );

        return;
    }

    const bannedUntil =
        new Date(
            Date.now() +
            seconds * 1000
        ).toISOString();

    const {
        error
    } = await client
        .from("profiles")
        .update({
            banned_until:
                bannedUntil
        })
        .eq(
            "id",
            userId
        );

    if (error) {

        console.error(
            "BAN ERROR:",
            error
        );

        alert(
            "Could not ban account: " +
            error.message
        );

        return;
    }

    alert(
        `${username} has been banned for ${seconds} seconds.`
    );

    await loadAdminAccounts();
}


// ============================================================
// UNBAN ACCOUNT
// ============================================================

async function unbanAccount(
    userId,
    username
) {

    if (!currentUserIsAdmin) {
        return;
    }

    const {
        error
    } = await client
        .from("profiles")
        .update({
            banned_until:
                null
        })
        .eq(
            "id",
            userId
        );

    if (error) {

        alert(
            "Could not unban account:\n" +
            error.message
        );

        return;
    }

    alert(
        `${username} has been unbanned.`
    );

    await loadAdminAccounts();
}


// ============================================================
// ADMIN RENAME ACCOUNT
// ============================================================

async function renameAccount(userId, oldUsername) {

    if (!currentUserIsAdmin) {
        alert("You are not an admin.");
        return;
    }

    const newUsername = prompt(
        `Rename "${oldUsername || "(No username)"}" to:`,
        oldUsername || ""
    );

    if (newUsername === null) {
        return;
    }

    const username = newUsername.trim();

    if (!username) {
        alert("Username cannot be empty.");
        return;
    }

    if (username.length > 30) {
        alert("Username must be 30 characters or less.");
        return;
    }

    if (containsBadWord(username)) {
        alert("That username contains a blocked word.");
        return;
    }

    if (username === oldUsername) {
        return;
    }

    const {
        data,
        error
    } = await client.rpc(
        "admin_rename_account",
        {
            target_user_id: userId,
            new_username: username
        }
    );

    if (error) {

        console.error(
            "RENAME ACCOUNT ERROR:",
            error
        );

        alert(
            "Could not rename account:\n" +
            error.message
        );

        return;
    }

    if (data !== true) {
        alert("The account could not be renamed.");
        return;
    }

    alert(
        `Account renamed to "${username}".`
    );

    await loadAdminAccounts();
    await loadList();
    await loadPosts();
    await loadRequests();
}


// ============================================================
// ADMIN ACCOUNTS
// ============================================================

async function loadAdminAccounts() {

    if (!currentUserIsAdmin) {
        return;
    }

    adminContent.innerHTML =
        "<h3>👤 ACCOUNTS</h3><p>Loading...</p>";

    const {
        data,
        error
    } = await client.rpc(
        "admin_get_accounts"
    );

    if (error) {

        console.error(
            "ADMIN ACCOUNT LOAD ERROR:",
            error
        );

        adminContent.innerHTML =
            `<p>Could not load accounts: ${escapeHTML(error.message)}</p>`;

        return;
    }

    adminContent.innerHTML =
        "<h3>👤 ACCOUNTS</h3>";

    if (
        !data ||
        data.length === 0
    ) {

        adminContent.innerHTML +=
            "<p>No accounts found.</p>";

        return;
    }

    const currentTime =
        Date.now();

    data.forEach(
        account => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "admin-item";

            const banned =
                account.banned_until &&
                new Date(
                    account.banned_until
                ).getTime() >
                    currentTime;

            let statusHTML;

            if (banned) {

                const until =
                    new Date(
                        account.banned_until
                    ).toLocaleString();

                statusHTML = `
                    <span class="admin-account-status admin-banned">
                        🚫 Banned until ${escapeHTML(until)}
                    </span>
                `;

            } else {

                statusHTML = `
                    <span class="admin-account-status admin-active">
                        ✅ Active
                    </span>
                `;
            }

            const adminHTML =
                account.is_admin
                    ? `
                        <span class="admin-admin">
                            👑 ADMIN
                        </span>
                    `
                    : "";

            item.innerHTML = `
                <div class="admin-item-top">

                    <strong></strong>

                    <div>

                        <button class="admin-rename">
                            ✏️ RENAME
                        </button>

                        ${
                            banned
                                ? `
                                    <button class="admin-unban">
                                        ✅ UNBAN
                                    </button>
                                `
                                : `
                                    <button class="admin-ban">
                                        🚫 BAN
                                    </button>
                                `
                        }

                    </div>

                </div>

                <div class="admin-item-info">

                    <div class="account-status"></div>

                    <div>
                        Email:
                        ${escapeHTML(
                            account.email || ""
                        )}
                    </div>

                    <div>
                        User ID:
                        ${escapeHTML(
                            account.id
                        )}
                    </div>

                    <div>
                        Created:
                        ${
                            account.created_at
                                ? escapeHTML(
                                    new Date(
                                        account.created_at
                                    ).toLocaleString()
                                )
                                : "Unknown"
                        }
                    </div>

                    <div>
                        ${adminHTML}
                    </div>

                </div>
            `;

            const username =
                account.username ||
                "";

            item.querySelector(
                "strong"
            ).textContent =
                username ||
                "(No username)";

            item.querySelector(
                ".account-status"
            ).innerHTML =
                statusHTML;


            // ====================================================
            // RENAME BUTTON
            // ====================================================

            const renameButton =
                item.querySelector(
                    ".admin-rename"
                );

            if (renameButton) {

                renameButton.onclick =
                    () =>
                        renameAccount(
                            account.id,
                            username
                        );
            }


            // ====================================================
            // BAN / UNBAN BUTTON
            // ====================================================

            if (banned) {

                const unbanButton =
                    item.querySelector(
                        ".admin-unban"
                    );

                if (unbanButton) {

                    unbanButton.onclick =
                        () =>
                            unbanAccount(
                                account.id,
                                username ||
                                    "this account"
                            );
                }

            } else {

                const banButton =
                    item.querySelector(
                        ".admin-ban"
                    );

                if (banButton) {

                    banButton.onclick =
                        () =>
                            banAccount(
                                account.id,
                                username ||
                                    "this account"
                            );
                }
            }

            adminContent.appendChild(
                item
            );
        }
    );
}


// ============================================================
// DIRECT MESSAGES
// ============================================================

const DM_POLL_INTERVAL_MS = 4000;

const dmPanel =
    document.getElementById("dmPanel");

const dmLoginMessage =
    document.getElementById("dmLoginMessage");

const dmControls =
    document.getElementById("dmControls");

const dmTarget =
    document.getElementById("dmTarget");

const openDmButton =
    document.getElementById("openDmButton");

const dmChatInfo =
    document.getElementById("dmChatInfo");

const dmGroupActions =
    document.getElementById("dmGroupActions");

const deleteGroupButton =
    document.getElementById("deleteGroupButton");

const leaveGroupButton =
    document.getElementById("leaveGroupButton");

const dmMessages =
    document.getElementById("dmMessages");

const dmMessageInput =
    document.getElementById("dmMessageInput");

const sendDmButton =
    document.getElementById("sendDmButton");

const dmMessageStatus =
    document.getElementById("dmMessageStatus");

const myGroupsList =
    document.getElementById("myGroupsList");

const newGroupButton =
    document.getElementById("newGroupButton");

const newGroupForm =
    document.getElementById("newGroupForm");

const groupNameInput =
    document.getElementById("groupNameInput");

const groupMembersChips =
    document.getElementById("groupMembersChips");

const addMemberButton =
    document.getElementById("addMemberButton");

const addMemberRow =
    document.getElementById("addMemberRow");

const groupMemberUsernameInput =
    document.getElementById("groupMemberUsernameInput");

const addPersonButton =
    document.getElementById("addPersonButton");

const addMemberStatus =
    document.getElementById("addMemberStatus");

const createGroupButton =
    document.getElementById("createGroupButton");

const cancelGroupButton =
    document.getElementById("cancelGroupButton");

const groupCreateStatus =
    document.getElementById("groupCreateStatus");

let currentDmUser = null;
let currentGroupChat = null;
let pendingGroupMembers = [];
let dmPollTimer = null;
let dmLoading = false;


// ============================================================
// DM UI
// ============================================================

function updateDmUI(loggedIn) {

    if (
        !dmLoginMessage ||
        !dmControls
    ) {
        return;
    }

    if (loggedIn) {

        dmLoginMessage.style.display =
            "none";

        dmControls.style.display =
            "block";

        loadMyGroups();

        return;
    }

    dmLoginMessage.style.display =
        "block";

    dmControls.style.display =
        "none";

    stopDmPolling();

    currentDmUser =
        null;

    currentGroupChat =
        null;

    resetGroupForm();

    if (myGroupsList) {
        myGroupsList.innerHTML =
            "";
    }

    if (dmChatInfo) {
        dmChatInfo.textContent =
            "";
    }

    if (dmMessageStatus) {
        dmMessageStatus.textContent =
            "";
    }

    if (dmMessages) {
        dmMessages.innerHTML =
            '<div style="color:#777;">Enter a username and open a chat.</div>';
    }

    if (dmGroupActions) {
        dmGroupActions.style.display =
            "none";
    }
}


// ============================================================
// DM POLLING
// ============================================================

function stopDmPolling() {

    if (dmPollTimer) {

        clearInterval(
            dmPollTimer
        );

        dmPollTimer =
            null;
    }
}

function startDmPolling() {

    stopDmPolling();

    dmPollTimer =
        setInterval(
            () => {

                if (currentGroupChat) {
                    loadGroupMessages(true);
                    return;
                }

                loadDmMessages(true);
            },
            DM_POLL_INTERVAL_MS
        );
}


// ============================================================
// OPEN DM CHAT
// ============================================================

async function openDmChat() {

    if (
        await checkIfBanned()
    ) {
        return;
    }

    if (
        !dmTarget ||
        !dmChatInfo
    ) {
        return;
    }

    const targetUsername =
        dmTarget.value.trim();

    if (!targetUsername) {

        dmChatInfo.textContent =
            "Enter a username first.";

        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        dmChatInfo.textContent =
            "You need to be logged in.";

        return;
    }

    const {
        data: myProfile
    } = await client
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

    if (
        myProfile &&
        targetUsername.toLowerCase() ===
            myProfile.username.toLowerCase()
    ) {

        dmChatInfo.textContent =
            "You can't message yourself.";

        return;
    }

    if (openDmButton) {
        openDmButton.disabled =
            true;
    }

    dmChatInfo.textContent =
        "Opening chat...";

    const {
        data: targetProfile,
        error
    } = await client
        .from("profiles")
        .select("id, username")
        .ilike(
            "username",
            targetUsername
        )
        .maybeSingle();

    if (openDmButton) {
        openDmButton.disabled =
            false;
    }

    if (error) {

        console.error(
            "DM TARGET LOOKUP ERROR:",
            error
        );

        dmChatInfo.textContent =
            "Error: " +
            error.message;

        return;
    }

    if (!targetProfile) {

        dmChatInfo.textContent =
            `No user named "${targetUsername}" found.`;

        currentDmUser =
            null;

        currentGroupChat =
            null;

        if (dmGroupActions) {
            dmGroupActions.style.display =
                "none";
        }

        if (dmMessages) {
            dmMessages.innerHTML =
                '<div style="color:#777;">Enter a username and open a chat.</div>';
        }

        stopDmPolling();

        return;
    }

    currentDmUser = {
        id: targetProfile.id,
        username: targetProfile.username
    };

    currentGroupChat =
        null;

    if (dmGroupActions) {
        dmGroupActions.style.display =
            "none";
    }

    dmChatInfo.textContent =
        `💬 Chatting with ${targetProfile.username}`;

    if (dmMessageStatus) {
        dmMessageStatus.textContent =
            "";
    }

    await loadDmMessages();

    startDmPolling();
}

if (openDmButton) {
    openDmButton.onclick =
        openDmChat;
}

if (dmTarget) {

    dmTarget.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {
                openDmChat();
            }
        }
    );
}


// ============================================================
// LOAD DM MESSAGES
// ============================================================

async function loadDmMessages(
    silent
) {

    if (!currentDmUser) {
        return;
    }

    if (dmLoading) {
        return;
    }

    if (!dmMessages) {
        return;
    }

    dmLoading =
        true;

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        dmLoading =
            false;

        return;
    }

    const {
        data,
        error
    } = await client
        .from("direct_messages")
        .select(
            "id, sender_id, sender_username, sender_is_admin, recipient_id, content, created_at"
        )
        .or(
            `and(sender_id.eq.${user.id},recipient_id.eq.${currentDmUser.id}),and(sender_id.eq.${currentDmUser.id},recipient_id.eq.${user.id})`
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    dmLoading =
        false;

    if (error) {

        if (!silent) {

            console.error(
                "DM LOAD ERROR:",
                error
            );

            dmChatInfo.textContent =
                "Could not load messages: " +
                error.message;
        }

        return;
    }

    const nearBottom =
        dmMessages.scrollTop +
            dmMessages.clientHeight >=
        dmMessages.scrollHeight - 30;

    dmMessages.innerHTML =
        "";

    if (
        !data ||
        data.length === 0
    ) {

        dmMessages.innerHTML =
            '<div style="color:#777;">No messages yet. Say hi!</div>';

        return;
    }

    data.forEach(msg => {

        const div =
            document.createElement("div");

        div.className =
            msg.sender_id === user.id
                ? "dm-message mine"
                : "dm-message";

        div.innerHTML = `
            <div class="dm-message-user"></div>
            <div class="dm-message-content"></div>
            <div class="dm-message-time"></div>
        `;

        div.querySelector(
            ".dm-message-user"
        ).textContent =
            (
                msg.sender_id === user.id
                    ? "You"
                    : msg.sender_username
            ) +
            (
                msg.sender_is_admin
                    ? " 👑 ADMIN"
                    : ""
            );

        div.querySelector(
            ".dm-message-content"
        ).textContent =
            msg.content;

        div.querySelector(
            ".dm-message-time"
        ).textContent =
            new Date(
                msg.created_at
            ).toLocaleString();

        dmMessages.appendChild(
            div
        );
    });

    if (
        !silent ||
        nearBottom
    ) {

        dmMessages.scrollTop =
            dmMessages.scrollHeight;
    }
}


// ============================================================
// SEND DM
// ============================================================

async function sendDmMessage() {

    if (currentGroupChat) {
        return sendGroupMessage();
    }

    if (
        await checkIfBanned()
    ) {
        return;
    }

    if (
        !dmMessageInput ||
        !dmMessageStatus
    ) {
        return;
    }

    if (!currentDmUser) {

        dmMessageStatus.textContent =
            "Open a chat first.";

        return;
    }

    const content =
        dmMessageInput.value.trim();

    if (!content) {

        dmMessageStatus.textContent =
            "Write a message first.";

        return;
    }

    if (
        containsBadWord(content)
    ) {

        dmMessageStatus.textContent =
            "Your message contains a blocked word.";

        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        dmMessageStatus.textContent =
            "You need to be logged in.";

        return;
    }

    const {
        data: myProfile,
        error: profileError
    } = await client
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

    if (
        profileError ||
        !myProfile
    ) {

        console.error(
            "DM SENDER PROFILE ERROR:",
            profileError
        );

        dmMessageStatus.textContent =
            "Profile error.";

        return;
    }

    if (sendDmButton) {
        sendDmButton.disabled =
            true;
    }

    dmMessageStatus.textContent =
        "Sending...";

    const {
        error
    } = await client
        .from("direct_messages")
        .insert([
            {
                sender_id: user.id,
                sender_username: myProfile.username,
                sender_is_admin: currentUserIsAdmin,
                recipient_id: currentDmUser.id,
                recipient_username: currentDmUser.username,
                content: content
            }
        ]);

    if (sendDmButton) {
        sendDmButton.disabled =
            false;
    }

    if (error) {

        console.error(
            "DM SEND ERROR:",
            error
        );

        dmMessageStatus.textContent =
            "Send error: " +
            error.message;

        return;
    }

    dmMessageInput.value =
        "";

    dmMessageStatus.textContent =
        "";

    await loadDmMessages();
}

if (sendDmButton) {
    sendDmButton.onclick =
        sendDmMessage;
}

if (dmMessageInput) {

    dmMessageInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendDmMessage();
            }
        }
    );
}


// ============================================================
// GROUP CHATS — LIST MY GROUPS
// ============================================================

async function loadMyGroups() {

    if (!myGroupsList) {
        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return;
    }

    const {
        data: memberships,
        error: membershipsError
    } = await client
        .from("group_chat_members")
        .select("group_id")
        .eq("user_id", user.id);

    if (membershipsError) {

        console.error(
            "GROUP MEMBERSHIPS LOAD ERROR:",
            membershipsError
        );

        return;
    }

    if (
        !memberships ||
        memberships.length === 0
    ) {

        myGroupsList.innerHTML =
            "";

        return;
    }

    const groupIds =
        memberships.map(
            row => row.group_id
        );

    const {
        data: groups,
        error: groupsError
    } = await client
        .from("group_chats")
        .select("id, name, created_by")
        .in("id", groupIds)
        .order("id", {
            ascending: true
        });

    if (groupsError) {

        console.error(
            "GROUPS LOAD ERROR:",
            groupsError
        );

        return;
    }

    myGroupsList.innerHTML =
        "";

    (groups || []).forEach(group => {

        const div =
            document.createElement("div");

        div.className =
            "group-item";

        div.innerHTML = `
            <div>
                <div class="group-item-name"></div>
            </div>
            <button class="group-open-button">OPEN</button>
        `;

        div.querySelector(
            ".group-item-name"
        ).textContent =
            "👥 " +
            group.name;

        div.querySelector(
            ".group-open-button"
        ).onclick =
            () =>
                openGroupChat(
                    group.id,
                    group.name,
                    group.created_by
                );

        myGroupsList.appendChild(
            div
        );
    });
}


// ============================================================
// GROUP CHATS — CREATE
// ============================================================

function renderGroupChips() {

    if (!groupMembersChips) {
        return;
    }

    groupMembersChips.innerHTML =
        "";

    pendingGroupMembers.forEach(member => {

        const chip =
            document.createElement("div");

        chip.className =
            "group-chip";

        chip.innerHTML = `
            <span></span>
            <button class="group-chip-remove" title="Remove">✕</button>
        `;

        chip.querySelector(
            "span"
        ).textContent =
            member.username;

        chip.querySelector(
            ".group-chip-remove"
        ).onclick =
            () => {

                pendingGroupMembers =
                    pendingGroupMembers.filter(
                        m => m.id !== member.id
                    );

                renderGroupChips();
            };

        groupMembersChips.appendChild(
            chip
        );
    });
}

function resetGroupForm() {

    if (newGroupForm) {
        newGroupForm.style.display =
            "none";
    }

    if (groupNameInput) {
        groupNameInput.value =
            "";
    }

    if (groupMemberUsernameInput) {
        groupMemberUsernameInput.value =
            "";
    }

    if (addMemberRow) {
        addMemberRow.style.display =
            "none";
    }

    if (addMemberStatus) {
        addMemberStatus.textContent =
            "";
    }

    if (groupCreateStatus) {
        groupCreateStatus.textContent =
            "";
    }

    pendingGroupMembers = [];

    renderGroupChips();
}

if (newGroupButton) {

    newGroupButton.onclick =
        () => {

            if (!newGroupForm) {
                return;
            }

            newGroupForm.style.display =
                newGroupForm.style.display === "none"
                    ? "block"
                    : "none";

            if (groupCreateStatus) {
                groupCreateStatus.textContent =
                    "";
            }
        };
}

if (cancelGroupButton) {

    cancelGroupButton.onclick =
        resetGroupForm;
}


// ============================================================
// GROUP CHATS — ADD PERSON
// ============================================================

if (addMemberButton) {

    addMemberButton.onclick =
        () => {

            if (!addMemberRow) {
                return;
            }

            addMemberRow.style.display =
                addMemberRow.style.display === "none"
                    ? "block"
                    : "none";

            if (
                addMemberRow.style.display === "block" &&
                groupMemberUsernameInput
            ) {
                groupMemberUsernameInput.focus();
            }

            if (addMemberStatus) {
                addMemberStatus.textContent =
                    "";
            }
        };
}

async function addPersonToGroup() {

    if (
        !groupMemberUsernameInput ||
        !addMemberStatus
    ) {
        return;
    }

    const username =
        groupMemberUsernameInput.value.trim();

    if (!username) {

        addMemberStatus.textContent =
            "Enter a username first.";

        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        addMemberStatus.textContent =
            "You need to be logged in.";

        return;
    }

    const {
        data: myProfile
    } = await client
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

    if (
        myProfile &&
        username.toLowerCase() ===
            myProfile.username.toLowerCase()
    ) {

        addMemberStatus.textContent =
            "You're added automatically — no need to add yourself.";

        return;
    }

    if (
        pendingGroupMembers.some(
            member =>
                member.username.toLowerCase() ===
                username.toLowerCase()
        )
    ) {

        addMemberStatus.textContent =
            `${username} is already in the group.`;

        return;
    }

    if (addPersonButton) {
        addPersonButton.disabled =
            true;
    }

    addMemberStatus.textContent =
        "Looking up user...";

    const {
        data: profile,
        error
    } = await client
        .from("profiles")
        .select("id, username")
        .ilike("username", username)
        .maybeSingle();

    if (addPersonButton) {
        addPersonButton.disabled =
            false;
    }

    if (error) {

        console.error(
            "GROUP ADD PERSON LOOKUP ERROR:",
            error
        );

        addMemberStatus.textContent =
            "Error: " +
            error.message;

        return;
    }

    if (!profile) {

        addMemberStatus.textContent =
            `No user named "${username}" found.`;

        return;
    }

    pendingGroupMembers = [
        ...pendingGroupMembers,
        profile
    ];

    renderGroupChips();

    groupMemberUsernameInput.value =
        "";

    addMemberStatus.textContent =
        `Added ${profile.username}.`;

    groupMemberUsernameInput.focus();
}

if (addPersonButton) {
    addPersonButton.onclick =
        addPersonToGroup;
}

if (groupMemberUsernameInput) {

    groupMemberUsernameInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                addPersonToGroup();
            }
        }
    );
}


// ============================================================
// GROUP CHATS — SUBMIT
// ============================================================

async function createGroupChat() {

    if (
        await checkIfBanned()
    ) {
        return;
    }

    if (
        !groupNameInput ||
        !groupCreateStatus
    ) {
        return;
    }

    const groupName =
        groupNameInput.value.trim();

    if (!groupName) {

        groupCreateStatus.textContent =
            "Enter a group name.";

        return;
    }

    if (
        containsBadWord(groupName)
    ) {

        groupCreateStatus.textContent =
            "Group name contains a blocked word.";

        return;
    }

    if (pendingGroupMembers.length === 0) {

        groupCreateStatus.textContent =
            "Add at least one other member.";

        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        groupCreateStatus.textContent =
            "You need to be logged in.";

        return;
    }

    const {
        data: myProfile,
        error: myProfileError
    } = await client
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

    if (
        myProfileError ||
        !myProfile
    ) {

        groupCreateStatus.textContent =
            "Profile error.";

        return;
    }

    if (createGroupButton) {
        createGroupButton.disabled =
            true;
    }

    groupCreateStatus.textContent =
        "Creating group...";

    const {
        data: newGroup,
        error: createError
    } = await client
        .from("group_chats")
        .insert([
            {
                name: groupName,
                created_by: user.id,
                created_by_username: myProfile.username
            }
        ])
        .select()
        .single();

    if (
        createError ||
        !newGroup
    ) {

        if (createGroupButton) {
            createGroupButton.disabled =
                false;
        }

        console.error(
            "GROUP CREATE ERROR:",
            createError
        );

        groupCreateStatus.textContent =
            "Could not create group: " +
            (createError
                ? createError.message
                : "unknown error");

        return;
    }

    const memberRows = [
        {
            group_id: newGroup.id,
            user_id: user.id,
            username: myProfile.username
        },
        ...pendingGroupMembers.map(profile => ({
            group_id: newGroup.id,
            user_id: profile.id,
            username: profile.username
        }))
    ];

    const {
        error: membersError
    } = await client
        .from("group_chat_members")
        .insert(memberRows);

    if (createGroupButton) {
        createGroupButton.disabled =
            false;
    }

    if (membersError) {

        console.error(
            "GROUP MEMBERS ADD ERROR:",
            membersError
        );

        groupCreateStatus.textContent =
            "Group created, but could not add members: " +
            membersError.message;

        return;
    }

    resetGroupForm();

    await loadMyGroups();

    openGroupChat(
        newGroup.id,
        newGroup.name,
        newGroup.created_by
    );
}

if (createGroupButton) {
    createGroupButton.onclick =
        createGroupChat;
}


// ============================================================
// GROUP CHATS — OPEN
// ============================================================

async function openGroupChat(
    groupId,
    groupName,
    createdBy
) {

    if (
        !dmChatInfo ||
        !dmMessages
    ) {
        return;
    }

    currentDmUser =
        null;

    currentGroupChat = {
        id: groupId,
        name: groupName,
        createdBy: createdBy
    };

    const {
        data: { user }
    } = await client.auth.getUser();

    const isOwner =
        user &&
        createdBy &&
        user.id === createdBy;

    if (dmGroupActions) {
        dmGroupActions.style.display =
            "block";
    }

    if (deleteGroupButton) {
        deleteGroupButton.style.display =
            isOwner
                ? "inline-block"
                : "none";
    }

    if (leaveGroupButton) {
        leaveGroupButton.style.display =
            isOwner
                ? "none"
                : "inline-block";
    }

    const {
        data: members,
        error: membersError
    } = await client
        .from("group_chat_members")
        .select("username")
        .eq("group_id", groupId)
        .order("joined_at", {
            ascending: true
        });

    const memberNames =
        membersError || !members
            ? ""
            : members
                  .map(row => row.username)
                  .join(", ");

    dmChatInfo.textContent =
        `👥 ${groupName}` +
        (memberNames
            ? ` (${memberNames})`
            : "");

    if (dmMessageStatus) {
        dmMessageStatus.textContent =
            "";
    }

    if (dmPanel) {
        dmPanel.scrollIntoView({
            behavior: "smooth"
        });
    }

    await loadGroupMessages();

    startDmPolling();
}


// ============================================================
// GROUP CHATS — DELETE (owner only)
// ============================================================

async function deleteGroupChat() {

    if (!currentGroupChat) {
        return;
    }

    if (
        !confirm(
            `Delete "${currentGroupChat.name}" for everyone? This cannot be undone.`
        )
    ) {
        return;
    }

    if (deleteGroupButton) {
        deleteGroupButton.disabled =
            true;
    }

    const {
        error
    } = await client
        .from("group_chats")
        .delete()
        .eq("id", currentGroupChat.id);

    if (deleteGroupButton) {
        deleteGroupButton.disabled =
            false;
    }

    if (error) {

        console.error(
            "GROUP DELETE ERROR:",
            error
        );

        alert(
            "Could not delete group:\n" +
            error.message
        );

        return;
    }

    closeGroupChat();

    await loadMyGroups();
}

if (deleteGroupButton) {
    deleteGroupButton.onclick =
        deleteGroupChat;
}


// ============================================================
// GROUP CHATS — LEAVE (non-owner members)
// ============================================================

async function leaveGroupChat() {

    if (!currentGroupChat) {
        return;
    }

    if (
        !confirm(
            `Leave "${currentGroupChat.name}"?`
        )
    ) {
        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return;
    }

    if (leaveGroupButton) {
        leaveGroupButton.disabled =
            true;
    }

    const {
        error
    } = await client
        .from("group_chat_members")
        .delete()
        .eq("group_id", currentGroupChat.id)
        .eq("user_id", user.id);

    if (leaveGroupButton) {
        leaveGroupButton.disabled =
            false;
    }

    if (error) {

        console.error(
            "GROUP LEAVE ERROR:",
            error
        );

        alert(
            "Could not leave group:\n" +
            error.message
        );

        return;
    }

    closeGroupChat();

    await loadMyGroups();
}

if (leaveGroupButton) {
    leaveGroupButton.onclick =
        leaveGroupChat;
}


// ============================================================
// GROUP CHATS — CLOSE (after delete/leave)
// ============================================================

function closeGroupChat() {

    currentGroupChat =
        null;

    stopDmPolling();

    if (dmChatInfo) {
        dmChatInfo.textContent =
            "";
    }

    if (dmMessages) {
        dmMessages.innerHTML =
            '<div style="color:#777;">Enter a username and open a chat.</div>';
    }

    if (dmGroupActions) {
        dmGroupActions.style.display =
            "none";
    }
}


// ============================================================
// GROUP CHATS — LOAD MESSAGES
// ============================================================

async function loadGroupMessages(
    silent
) {

    if (!currentGroupChat) {
        return;
    }

    if (dmLoading) {
        return;
    }

    if (!dmMessages) {
        return;
    }

    dmLoading =
        true;

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        dmLoading =
            false;

        return;
    }

    const {
        data,
        error
    } = await client
        .from("group_messages")
        .select(
            "id, group_id, sender_id, sender_username, sender_is_admin, content, created_at"
        )
        .eq("group_id", currentGroupChat.id)
        .order("created_at", {
            ascending: true
        });

    dmLoading =
        false;

    if (error) {

        if (!silent) {

            console.error(
                "GROUP MESSAGES LOAD ERROR:",
                error
            );

            dmChatInfo.textContent =
                "Could not load messages: " +
                error.message;
        }

        return;
    }

    const nearBottom =
        dmMessages.scrollTop +
            dmMessages.clientHeight >=
        dmMessages.scrollHeight - 30;

    dmMessages.innerHTML =
        "";

    if (
        !data ||
        data.length === 0
    ) {

        dmMessages.innerHTML =
            '<div style="color:#777;">No messages yet. Say hi!</div>';

        return;
    }

    data.forEach(msg => {

        const div =
            document.createElement("div");

        div.className =
            msg.sender_id === user.id
                ? "dm-message mine"
                : "dm-message";

        div.innerHTML = `
            <div class="dm-message-user"></div>
            <div class="dm-message-content"></div>
            <div class="dm-message-time"></div>
        `;

        div.querySelector(
            ".dm-message-user"
        ).textContent =
            (
                msg.sender_id === user.id
                    ? "You"
                    : msg.sender_username
            ) +
            (
                msg.sender_is_admin
                    ? " 👑 ADMIN"
                    : ""
            );

        div.querySelector(
            ".dm-message-content"
        ).textContent =
            msg.content;

        div.querySelector(
            ".dm-message-time"
        ).textContent =
            new Date(
                msg.created_at
            ).toLocaleString();

        dmMessages.appendChild(
            div
        );
    });

    if (
        !silent ||
        nearBottom
    ) {

        dmMessages.scrollTop =
            dmMessages.scrollHeight;
    }
}


// ============================================================
// GROUP CHATS — SEND MESSAGE
// ============================================================

async function sendGroupMessage() {

    if (
        await checkIfBanned()
    ) {
        return;
    }

    if (
        !dmMessageInput ||
        !dmMessageStatus
    ) {
        return;
    }

    if (!currentGroupChat) {

        dmMessageStatus.textContent =
            "Open a group chat first.";

        return;
    }

    const content =
        dmMessageInput.value.trim();

    if (!content) {

        dmMessageStatus.textContent =
            "Write a message first.";

        return;
    }

    if (
        containsBadWord(content)
    ) {

        dmMessageStatus.textContent =
            "Your message contains a blocked word.";

        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {

        dmMessageStatus.textContent =
            "You need to be logged in.";

        return;
    }

    const {
        data: myProfile,
        error: profileError
    } = await client
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

    if (
        profileError ||
        !myProfile
    ) {

        console.error(
            "GROUP SENDER PROFILE ERROR:",
            profileError
        );

        dmMessageStatus.textContent =
            "Profile error.";

        return;
    }

    if (sendDmButton) {
        sendDmButton.disabled =
            true;
    }

    dmMessageStatus.textContent =
        "Sending...";

    const {
        error
    } = await client
        .from("group_messages")
        .insert([
            {
                group_id: currentGroupChat.id,
                sender_id: user.id,
                sender_username: myProfile.username,
                sender_is_admin: currentUserIsAdmin,
                content: content
            }
        ]);

    if (sendDmButton) {
        sendDmButton.disabled =
            false;
    }

    if (error) {

        console.error(
            "GROUP MESSAGE SEND ERROR:",
            error
        );

        dmMessageStatus.textContent =
            "Send error: " +
            error.message;

        return;
    }

    dmMessageInput.value =
        "";

    dmMessageStatus.textContent =
        "";

    await loadGroupMessages();
}


// ============================================================
// ADMIN DIRECT MESSAGES — CONVERSATION LIST
// ============================================================

async function loadAdminConversations() {

    if (!currentUserIsAdmin) {
        return;
    }

    adminContent.innerHTML =
        "<h3>💬 DIRECT MESSAGES</h3><p>Loading...</p>";

    const {
        data,
        error
    } = await client
        .from("direct_messages")
        .select(
            "id, sender_id, sender_username, recipient_id, recipient_username, content, created_at"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "ADMIN DM LOAD ERROR:",
            error
        );

        adminContent.innerHTML =
            `<p>Could not load direct messages: ${escapeHTML(error.message)}</p>`;

        return;
    }

    adminContent.innerHTML =
        "<h3>💬 DIRECT MESSAGES</h3>";

    if (
        !data ||
        data.length === 0
    ) {

        adminContent.innerHTML +=
            "<p>No direct messages.</p>";

        return;
    }

    const conversations =
        new Map();

    data.forEach(msg => {

        const key =
            [
                msg.sender_id,
                msg.recipient_id
            ]
                .sort()
                .join("|");

        let convo =
            conversations.get(key);

        if (!convo) {

            convo = {
                userAId: msg.sender_id,
                userAName: msg.sender_username,
                userBId: msg.recipient_id,
                userBName: msg.recipient_username,
                count: 0,
                lastAt: msg.created_at,
                lastContent: msg.content
            };

            conversations.set(
                key,
                convo
            );
        }

        convo.count =
            convo.count + 1;
    });

    const sortedConversations =
        Array.from(
            conversations.values()
        ).sort(
            (a, b) =>
                new Date(b.lastAt) -
                new Date(a.lastAt)
        );

    sortedConversations.forEach(
        convo => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "admin-item";

            item.innerHTML = `
                <div class="admin-item-top">

                    <strong></strong>

                    <div>

                        <button class="admin-view">
                            👁️ VIEW
                        </button>

                        <button class="admin-delete">
                            🗑️ DELETE CONVERSATION
                        </button>

                    </div>

                </div>

                <div class="admin-item-content"></div>

                <div class="admin-item-info"></div>
            `;

            item.querySelector(
                "strong"
            ).textContent =
                `👤 ${convo.userAName} ↔ ${convo.userBName}`;

            item.querySelector(
                ".admin-item-content"
            ).textContent =
                convo.lastContent;

            item.querySelector(
                ".admin-item-info"
            ).textContent =
                `${convo.count} message${convo.count === 1 ? "" : "s"} • Last: ${new Date(convo.lastAt).toLocaleString()}`;

            item.querySelector(
                ".admin-view"
            ).onclick =
                () =>
                    loadAdminConversationMessages(
                        convo.userAId,
                        convo.userBId,
                        convo.userAName,
                        convo.userBName
                    );

            item.querySelector(
                ".admin-delete"
            ).onclick =
                async () => {

                    if (
                        !confirm(
                            `Delete the entire conversation between ${convo.userAName} and ${convo.userBName}? This cannot be undone.`
                        )
                    ) {
                        return;
                    }

                    await adminDeleteConversation(
                        convo.userAId,
                        convo.userBId,
                        convo.userAName,
                        convo.userBName
                    );
                };

            adminContent.appendChild(
                item
            );
        }
    );
}


// ============================================================
// ADMIN DIRECT MESSAGES — SINGLE CONVERSATION VIEW
// ============================================================

async function loadAdminConversationMessages(
    userAId,
    userBId,
    userAName,
    userBName
) {

    if (!currentUserIsAdmin) {
        return;
    }

    adminContent.innerHTML =
        `<h3>💬 ${escapeHTML(userAName)} ↔ ${escapeHTML(userBName)}</h3><p>Loading...</p>`;

    const {
        data,
        error
    } = await client
        .from("direct_messages")
        .select(
            "id, sender_id, sender_username, sender_is_admin, recipient_id, recipient_username, content, created_at"
        )
        .or(
            `and(sender_id.eq.${userAId},recipient_id.eq.${userBId}),and(sender_id.eq.${userBId},recipient_id.eq.${userAId})`
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "ADMIN DM CONVERSATION LOAD ERROR:",
            error
        );

        adminContent.innerHTML =
            `<p>Could not load conversation: ${escapeHTML(error.message)}</p>`;

        return;
    }

    adminContent.innerHTML = `
        <h3>💬 ${escapeHTML(userAName)} ↔ ${escapeHTML(userBName)}</h3>

        <div class="admin-buttons">

            <button id="adminDmBackButton">
                ⬅️ BACK TO CONVERSATIONS
            </button>

            <button id="adminDmDeleteConvoButton" class="admin-delete">
                🗑️ DELETE ENTIRE CONVERSATION
            </button>

        </div>
    `;

    document
        .getElementById(
            "adminDmBackButton"
        )
        .onclick =
        loadAdminConversations;

    document
        .getElementById(
            "adminDmDeleteConvoButton"
        )
        .onclick =
        async () => {

            if (
                !confirm(
                    `Delete the entire conversation between ${userAName} and ${userBName}? This cannot be undone.`
                )
            ) {
                return;
            }

            await adminDeleteConversation(
                userAId,
                userBId,
                userAName,
                userBName
            );
        };

    if (
        !data ||
        data.length === 0
    ) {

        adminContent.innerHTML +=
            "<p>No messages in this conversation.</p>";

        return;
    }

    data.forEach(
        msg => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "admin-item";

            item.innerHTML = `
                <div class="admin-item-top">

                    <strong></strong>

                    <button class="admin-delete">
                        🗑️ DELETE
                    </button>

                </div>

                <div class="admin-item-content"></div>

                <div class="admin-item-info"></div>
            `;

            item.querySelector(
                "strong"
            ).textContent =
                "👤 " +
                msg.sender_username +
                (
                    msg.sender_is_admin
                        ? " 👑 ADMIN"
                        : ""
                );

            item.querySelector(
                ".admin-item-content"
            ).textContent =
                msg.content;

            item.querySelector(
                ".admin-item-info"
            ).textContent =
                `To: ${msg.recipient_username} • ${new Date(msg.created_at).toLocaleString()} • ID: ${msg.id}`;

            item.querySelector(
                ".admin-delete"
            ).onclick =
                async () => {

                    if (
                        !confirm(
                            "Delete this message?"
                        )
                    ) {
                        return;
                    }

                    await adminDeleteDm(
                        msg.id,
                        userAId,
                        userBId,
                        userAName,
                        userBName
                    );
                };

            adminContent.appendChild(
                item
            );
        }
    );
}


// ============================================================
// ADMIN DELETE SINGLE DM
// ============================================================

async function adminDeleteDm(
    messageId,
    userAId,
    userBId,
    userAName,
    userBName
) {

    if (!currentUserIsAdmin) {
        return;
    }

    const {
        error
    } = await client
        .from("direct_messages")
        .delete()
        .eq(
            "id",
            messageId
        );

    if (error) {

        alert(
            "Could not delete message:\n" +
            error.message
        );

        return;
    }

    await loadAdminConversationMessages(
        userAId,
        userBId,
        userAName,
        userBName
    );

    if (
        currentDmUser &&
        (
            currentDmUser.id === userAId ||
            currentDmUser.id === userBId
        )
    ) {
        await loadDmMessages();
    }
}


// ============================================================
// ADMIN DELETE ENTIRE CONVERSATION
// ============================================================

async function adminDeleteConversation(
    userAId,
    userBId,
    userAName,
    userBName
) {

    if (!currentUserIsAdmin) {
        return;
    }

    const {
        error
    } = await client
        .from("direct_messages")
        .delete()
        .or(
            `and(sender_id.eq.${userAId},recipient_id.eq.${userBId}),and(sender_id.eq.${userBId},recipient_id.eq.${userAId})`
        );

    if (error) {

        alert(
            "Could not delete conversation:\n" +
            error.message
        );

        return;
    }

    alert(
        `Conversation between ${userAName} and ${userBName} deleted.`
    );

    await loadAdminConversations();

    if (
        currentDmUser &&
        (
            currentDmUser.id === userAId ||
            currentDmUser.id === userBId
        )
    ) {
        await loadDmMessages();
    }
}


// ============================================================
// NOTIFICATIONS
// ============================================================

const NOTIF_POLL_MS = 20000;

const notifBellButton =
    document.getElementById("notifBellButton");

const notifBadge =
    document.getElementById("notifBadge");

const notifPanel =
    document.getElementById("notifPanel");

const notifList =
    document.getElementById("notifList");

const notifMarkReadButton =
    document.getElementById("notifMarkReadButton");

const notifPermissionButton =
    document.getElementById("notifPermissionButton");

let notifPollTimer = null;
let notifItems = [];
let notifLoading = false;
let nativeNotifiedKeys = new Set();


// ============================================================
// NATIVE BROWSER/DESKTOP NOTIFICATIONS
// ============================================================

function updateNotifPermissionButton() {

    if (!notifPermissionButton) {
        return;
    }

    if (typeof Notification === "undefined") {

        notifPermissionButton.style.display =
            "none";

        return;
    }

    if (Notification.permission === "granted") {

        notifPermissionButton.style.display =
            "none";

        return;
    }

    notifPermissionButton.style.display =
        "inline-block";

    if (Notification.permission === "denied") {

        notifPermissionButton.textContent =
            "🔕 ALERTS BLOCKED";

        notifPermissionButton.disabled =
            true;

        notifPermissionButton.title =
            "Notifications are blocked in your browser's site settings.";

        return;
    }

    notifPermissionButton.textContent =
        "🔔 ENABLE ALERTS";

    notifPermissionButton.disabled =
        false;

    notifPermissionButton.title =
        "";
}

if (notifPermissionButton) {

    notifPermissionButton.onclick =
        async () => {

            if (typeof Notification === "undefined") {
                return;
            }

            const permission =
                await Notification.requestPermission();

            updateNotifPermissionButton();

            if (permission === "granted") {
                await subscribeToPush();
            }
        };
}

function showNativeNotification(item) {

    if (typeof Notification === "undefined") {
        return;
    }

    if (Notification.permission !== "granted") {
        return;
    }

    if (nativeNotifiedKeys.has(item.key)) {
        return;
    }

    nativeNotifiedKeys.add(
        item.key
    );

    if (
        document.visibilityState === "visible" &&
        document.hasFocus()
    ) {
        return;
    }

    let title =
        "THE GANG";

    if (item.type === "dm") {
        title =
            "New direct message";
    }

    if (item.type === "post_reply") {
        title =
            "New reply to your post";
    }

    if (item.type === "request_reply") {
        title =
            "New reply to your request";
    }

    if (item.type === "group_message") {
        title =
            "New group message";
    }

    const body =
        item.preview
            ? `${item.text}: "${item.preview.slice(0, 100)}${item.preview.length > 100 ? "…" : ""}"`
            : item.text;

    let notification;

    try {

        notification =
            new Notification(title, {
                body: body,
                tag: item.key
            });

    } catch (error) {

        console.error(
            "NATIVE NOTIFICATION ERROR:",
            error
        );

        return;
    }

    notification.onclick =
        () => {

            window.focus();

            goToNotification(item);

            notification.close();
        };
}

function updateNotifBadge(count) {

    if (!notifBadge) {
        return;
    }

    if (count > 0) {

        notifBadge.textContent =
            count > 99
                ? "99+"
                : String(count);

        notifBadge.style.display =
            "flex";

        return;
    }

    notifBadge.style.display =
        "none";
}

function closeNotifPanel() {

    if (notifPanel) {
        notifPanel.style.display =
            "none";
    }
}

function toggleNotifPanel() {

    if (!notifPanel) {
        return;
    }

    const opening =
        notifPanel.style.display === "none";

    notifPanel.style.display =
        opening
            ? "block"
            : "none";

    if (opening) {
        updateNotifPermissionButton();
        loadNotifications();
    }
}

if (notifBellButton) {
    notifBellButton.onclick =
        toggleNotifPanel;
}

document.addEventListener(
    "click",
    event => {

        if (
            !notifPanel ||
            notifPanel.style.display === "none"
        ) {
            return;
        }

        if (
            notifPanel.contains(event.target) ||
            (notifBellButton && notifBellButton.contains(event.target))
        ) {
            return;
        }

        closeNotifPanel();
    }
);


// ============================================================
// NOTIFICATION STATE (last checked)
// ============================================================

async function getNotifState(userId) {

    const {
        data,
        error
    } = await client
        .from("notification_state")
        .select("last_checked_at")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {

        console.error(
            "NOTIF STATE LOAD ERROR:",
            error
        );

        return null;
    }

    if (data) {
        return data.last_checked_at;
    }

    const nowIso =
        new Date().toISOString();

    const {
        error: insertError
    } = await client
        .from("notification_state")
        .upsert([
            {
                user_id: userId,
                last_checked_at: nowIso
            }
        ]);

    if (insertError) {

        console.error(
            "NOTIF STATE INIT ERROR:",
            insertError
        );
    }

    return nowIso;
}

async function markNotificationsRead() {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return;
    }

    const nowIso =
        new Date().toISOString();

    const {
        error
    } = await client
        .from("notification_state")
        .upsert([
            {
                user_id: user.id,
                last_checked_at: nowIso
            }
        ]);

    if (error) {

        console.error(
            "NOTIF MARK READ ERROR:",
            error
        );

        return;
    }

    notifItems.forEach(item => {
        item.unread = false;
    });

    updateNotifBadge(0);

    renderNotifList();
}

if (notifMarkReadButton) {
    notifMarkReadButton.onclick =
        markNotificationsRead;
}


// ============================================================
// NOTIFICATION DISMISSAL (X / CLEAR ALL)
// ============================================================

const notifClearAllButton =
    document.getElementById("notifClearAllButton");

async function getDismissedKeys(userId) {

    const {
        data,
        error
    } = await client
        .from("notification_dismissals")
        .select("notif_key")
        .eq("user_id", userId);

    if (error) {

        console.error(
            "NOTIF DISMISSALS LOAD ERROR:",
            error
        );

        return new Set();
    }

    return new Set(
        (data || []).map(
            row => row.notif_key
        )
    );
}

async function dismissNotification(key) {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return;
    }

    const {
        error
    } = await client
        .from("notification_dismissals")
        .upsert([
            {
                user_id: user.id,
                notif_key: key
            }
        ]);

    if (error) {

        console.error(
            "NOTIF DISMISS ERROR:",
            error
        );

        return;
    }

    notifItems =
        notifItems.filter(
            item => item.key !== key
        );

    const unreadCount =
        notifItems.filter(
            item => item.unread
        ).length;

    updateNotifBadge(
        unreadCount
    );

    renderNotifList();
}

async function clearAllNotifications() {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return;
    }

    if (notifItems.length === 0) {
        return;
    }

    const rows =
        notifItems.map(item => ({
            user_id: user.id,
            notif_key: item.key
        }));

    const {
        error
    } = await client
        .from("notification_dismissals")
        .upsert(rows);

    if (error) {

        console.error(
            "NOTIF CLEAR ALL ERROR:",
            error
        );

        alert(
            "Could not clear notifications:\n" +
            error.message
        );

        return;
    }

    notifItems = [];

    updateNotifBadge(0);

    renderNotifList();
}

if (notifClearAllButton) {
    notifClearAllButton.onclick =
        clearAllNotifications;
}


// ============================================================
// LOAD NOTIFICATIONS
// ============================================================

async function loadNotifications(silent) {

    if (notifLoading) {
        return;
    }

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return;
    }

    notifLoading =
        true;

    const lastChecked =
        await getNotifState(user.id);

    const items = [];

    // --- direct messages received ---

    const {
        data: dms,
        error: dmError
    } = await client
        .from("direct_messages")
        .select(
            "id, sender_id, sender_username, content, created_at"
        )
        .eq("recipient_id", user.id)
        .order("created_at", {
            ascending: false
        })
        .limit(30);

    if (dmError) {

        console.error(
            "NOTIF DM LOAD ERROR:",
            dmError
        );

    } else {

        (dms || []).forEach(dm => {

            items.push({
                type: "dm",
                key: "dm:" + dm.id,
                text: `${dm.sender_username} sent you a message`,
                preview: dm.content,
                created_at: dm.created_at,
                unread:
                    lastChecked &&
                    new Date(dm.created_at) > new Date(lastChecked),
                data: {
                    username: dm.sender_username
                }
            });
        });
    }

    // --- replies to my posts ---

    const {
        data: myPosts,
        error: myPostsError
    } = await client
        .from("posts_test")
        .select("id")
        .eq("author_id", user.id);

    if (myPostsError) {

        console.error(
            "NOTIF MY POSTS LOAD ERROR:",
            myPostsError
        );

    } else if (
        myPosts &&
        myPosts.length > 0
    ) {

        const myPostIds =
            myPosts.map(
                post => post.id
            );

        const {
            data: replies,
            error: repliesError
        } = await client
            .from("post_replies")
            .select(
                "id, post_id, author_id, username, content, created_at"
            )
            .in("post_id", myPostIds)
            .neq("author_id", user.id)
            .order("created_at", {
                ascending: false
            })
            .limit(30);

        if (repliesError) {

            console.error(
                "NOTIF POST REPLIES LOAD ERROR:",
                repliesError
            );

        } else {

            (replies || []).forEach(reply => {

                items.push({
                    type: "post_reply",
                    key: "post_reply:" + reply.id,
                    text: `${reply.username} replied to your post`,
                    preview: reply.content,
                    created_at: reply.created_at,
                    unread:
                        lastChecked &&
                        new Date(reply.created_at) > new Date(lastChecked),
                    data: {
                        postId: reply.post_id
                    }
                });
            });
        }
    }

    // --- replies to my requests ---

    const {
        data: myRequests,
        error: myRequestsError
    } = await client
        .from("requests")
        .select("id")
        .eq("user_id", user.id);

    if (myRequestsError) {

        console.error(
            "NOTIF MY REQUESTS LOAD ERROR:",
            myRequestsError
        );

    } else if (
        myRequests &&
        myRequests.length > 0
    ) {

        const myRequestIds =
            myRequests.map(
                request => request.id
            );

        const {
            data: requestReplies,
            error: requestRepliesError
        } = await client
            .from("request_replies")
            .select(
                "id, request_id, user_id, username, content, created_at"
            )
            .in("request_id", myRequestIds)
            .neq("user_id", user.id)
            .order("created_at", {
                ascending: false
            })
            .limit(30);

        if (requestRepliesError) {

            console.error(
                "NOTIF REQUEST REPLIES LOAD ERROR:",
                requestRepliesError
            );

        } else {

            (requestReplies || []).forEach(reply => {

                items.push({
                    type: "request_reply",
                    key: "request_reply:" + reply.id,
                    text: `${reply.username} replied to your request`,
                    preview: reply.content,
                    created_at: reply.created_at,
                    unread:
                        lastChecked &&
                        new Date(reply.created_at) > new Date(lastChecked),
                    data: {
                        requestId: reply.request_id
                    }
                });
            });
        }
    }

    // --- messages in my group chats ---

    const {
        data: myGroupMemberships,
        error: myGroupMembershipsError
    } = await client
        .from("group_chat_members")
        .select("group_id")
        .eq("user_id", user.id);

    if (myGroupMembershipsError) {

        console.error(
            "NOTIF MY GROUPS LOAD ERROR:",
            myGroupMembershipsError
        );

    } else if (
        myGroupMemberships &&
        myGroupMemberships.length > 0
    ) {

        const myGroupIds =
            myGroupMemberships.map(
                row => row.group_id
            );

        const {
            data: myGroups,
            error: myGroupsError
        } = await client
            .from("group_chats")
            .select("id, name, created_by")
            .in("id", myGroupIds);

        const groupNameById = {};
        const groupCreatedByById = {};

        (myGroups || []).forEach(group => {
            groupNameById[group.id] =
                group.name;
            groupCreatedByById[group.id] =
                group.created_by;
        });

        if (myGroupsError) {

            console.error(
                "NOTIF GROUP NAMES LOAD ERROR:",
                myGroupsError
            );
        }

        const {
            data: groupMsgs,
            error: groupMsgsError
        } = await client
            .from("group_messages")
            .select(
                "id, group_id, sender_id, sender_username, content, created_at"
            )
            .in("group_id", myGroupIds)
            .neq("sender_id", user.id)
            .order("created_at", {
                ascending: false
            })
            .limit(30);

        if (groupMsgsError) {

            console.error(
                "NOTIF GROUP MESSAGES LOAD ERROR:",
                groupMsgsError
            );

        } else {

            (groupMsgs || []).forEach(msg => {

                const groupName =
                    groupNameById[msg.group_id] ||
                    "a group chat";

                items.push({
                    type: "group_message",
                    key: "group_message:" + msg.id,
                    text: `${msg.sender_username} sent a message in ${groupName}`,
                    preview: msg.content,
                    created_at: msg.created_at,
                    unread:
                        lastChecked &&
                        new Date(msg.created_at) > new Date(lastChecked),
                    data: {
                        groupId: msg.group_id,
                        groupName: groupName,
                        createdBy: groupCreatedByById[msg.group_id]
                    }
                });
            });
        }
    }

    items.sort(
        (a, b) =>
            new Date(b.created_at) -
            new Date(a.created_at)
    );

    const dismissedKeys =
        await getDismissedKeys(user.id);

    const visibleItems =
        items.filter(
            item =>
                !dismissedKeys.has(item.key)
        );

    notifItems =
        visibleItems.slice(0, 40);

    notifItems
        .filter(item => item.unread)
        .forEach(item => {
            showNativeNotification(item);
        });

    notifLoading =
        false;

    const unreadCount =
        notifItems.filter(
            item => item.unread
        ).length;

    updateNotifBadge(
        unreadCount
    );

    if (
        !silent ||
        (notifPanel && notifPanel.style.display !== "none")
    ) {
        renderNotifList();
    }
}


// ============================================================
// RENDER NOTIFICATIONS
// ============================================================

function renderNotifList() {

    if (!notifList) {
        return;
    }

    notifList.innerHTML =
        "";

    if (notifItems.length === 0) {

        notifList.innerHTML =
            '<div style="color:#777;">No notifications yet.</div>';

        return;
    }

    notifItems.forEach(item => {

        const div =
            document.createElement("div");

        div.className =
            item.unread
                ? "notif-item unread"
                : "notif-item";

        div.innerHTML = `
            <div class="notif-item-top">
                <div class="notif-item-text"></div>
                <button class="notif-item-close" title="Dismiss">✕</button>
            </div>
            <div class="notif-item-time"></div>
        `;

        div.querySelector(
            ".notif-item-text"
        ).textContent =
            item.preview
                ? `${item.text}: "${item.preview.slice(0, 80)}${item.preview.length > 80 ? "…" : ""}"`
                : item.text;

        div.querySelector(
            ".notif-item-time"
        ).textContent =
            new Date(
                item.created_at
            ).toLocaleString();

        div.querySelector(
            ".notif-item-close"
        ).onclick =
            event => {

                event.stopPropagation();

                dismissNotification(
                    item.key
                );
            };

        div.onclick =
            () =>
                goToNotification(item);

        notifList.appendChild(
            div
        );
    });
}


// ============================================================
// NOTIFICATION CLICK NAVIGATION
// ============================================================

function flashElement(el) {

    if (!el) {
        return;
    }

    el.classList.remove(
        "highlight-flash"
    );

    void el.offsetWidth;

    el.classList.add(
        "highlight-flash"
    );
}

async function goToNotification(item) {

    closeNotifPanel();

    if (item.type === "dm") {

        if (dmTarget) {
            dmTarget.value =
                item.data.username;
        }

        if (dmPanel) {
            dmPanel.scrollIntoView({
                behavior: "smooth"
            });
        }

        await openDmChat();

        return;
    }

    if (item.type === "post_reply") {

        const el =
            document.getElementById(
                "post-" + item.data.postId
            );

        if (el) {

            el.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            flashElement(el);
        }

        return;
    }

    if (item.type === "request_reply") {

        const el =
            document.getElementById(
                "request-" + item.data.requestId
            );

        if (el) {

            el.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            flashElement(el);
        }

        return;
    }

    if (item.type === "group_message") {

        if (dmPanel) {
            dmPanel.scrollIntoView({
                behavior: "smooth"
            });
        }

        await openGroupChat(
            item.data.groupId,
            item.data.groupName,
            item.data.createdBy
        );
    }
}


// ============================================================
// NOTIFICATION POLLING
// ============================================================

function startNotificationPolling() {

    stopNotificationPolling();

    updateNotifPermissionButton();

    if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
    ) {
        subscribeToPush();
    }

    loadNotifications(true);

    notifPollTimer =
        setInterval(
            () => {
                loadNotifications(true);
            },
            NOTIF_POLL_MS
        );
}

function stopNotificationPolling() {

    if (notifPollTimer) {

        clearInterval(
            notifPollTimer
        );

        notifPollTimer =
            null;
    }

    notifItems = [];

    nativeNotifiedKeys =
        new Set();
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}


// ============================================================
// INITIAL LOAD
// ============================================================

async function initialize() {

    await loadAdminUserIds();

    await loadList();

    await updateAccountUI();

    await loadPosts();

    await loadRequests();

    await updateAdminUI();
}


// ============================================================
// ADMIN INITIALIZATION
// ============================================================

createAdminPanel();

client.auth.onAuthStateChange(
    async () => {

        setTimeout(
            updateAdminUI,
            100
        );
    }
);

initialize();