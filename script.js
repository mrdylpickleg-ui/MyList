const SUPABASE_URL = "https://kexexqwxcsioigqrkfco.supabase.co";
const SUPABASE_KEY = "sb_publishable_gyfnuRePRt7va__Ju4NnSw_OInau_Gz";
const BAD_WORDS = [
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
	"shitty"
];

function containsBadWord(name) {
    const lowerName = name.toLowerCase();

    return BAD_WORDS.some(word =>
        lowerName.includes(word.toLowerCase())
    );
}

const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const joinButton = document.getElementById("joinButton");
const nameBox = document.getElementById("nameBox");
const nameInput = document.getElementById("nameInput");
const submitButton = document.getElementById("submitButton");
const list = document.getElementById("list");
const message = document.getElementById("message");

joinButton.addEventListener("click", () => {
    nameBox.classList.remove("hidden");
    nameInput.focus();
});

submitButton.addEventListener("click", joinList);

async function joinList() {
    const name = nameInput.value.trim();

    if (!name) {
        message.textContent = "Please enter a name.";
        return;
    }

    if (containsBadWord(name)) {
        message.textContent = "❌ That name isn't allowed.";
        return;
    }

    const { error } = await client
        .from("entries")
        .insert({ name: name });

    if (error) {
        console.error(error);
        message.textContent = "Something went wrong.";
        return;
    }

    message.textContent = "You're on the gang! 🎉";
    nameInput.value = "";

    loadList();
}

async function loadList() {
    const { data, error } = await client
        .from("entries")
        .select("id, name")
        .order("id", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    list.innerHTML = "";

    data.forEach(entry => {
        const div = document.createElement("div");
        div.className = "entry";

        div.innerHTML = `
            <div class="number">#${entry.id}</div>
            <div class="name"></div>
        `;

        div.querySelector(".name").textContent = entry.name;

        list.appendChild(div);
    });
}

loadList();