
window.TuklassCalendar = (function () {
const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzm5LpGtEla7cszMG0OIxZqf_pwuxJnOSmpEwUkqsiz886ql12hDFBHdxFBCWYyVYxf/exec";


const ACCESS_CACHE_TIME =
    5 * 60 * 1000;


let currentUser =
    null;


let calendarData =
    null;


let displayedMonth =
    new Date();


displayedMonth.setDate(
    1
);



/* =========================================================
   START
========================================================= */

async function init() {

        const saved =
            localStorage.getItem(
                "writejotUser"
            );


        if (!saved) {

            location.href =
                "index.html";

            return;

        }


        try {

            currentUser =
                JSON.parse(
                    saved
                );

        }

        catch {

            location.href =
                "index.html";

            return;

        }


        document
            .getElementById(
                "eventDate"
            )
            .value =
            localDateString(
                new Date()
            );


        const cachedAccess =
            getCachedAccess();


        if (
            cachedAccess &&
            cachedAccess.access === true
        ) {

            loadCalendarCache();


            if (
                calendarData
            ) {

                renderState();

            }


            refreshCalendar();

        }

        else {

            verifyAccessAndStart();

        }

}


/* =========================================================
   ACCESS
========================================================= */

function accessCacheKey() {

    return (
        "writejot_access_" +
        String(
            currentUser.email
        )
        .trim()
        .toLowerCase()
    );

}


function getCachedAccess() {

    try {

        const raw =
            localStorage.getItem(
                accessCacheKey()
            );


        if (!raw) {
            return null;
        }


        const data =
            JSON.parse(
                raw
            );


        if (
            Date.now() -
            Number(
                data.checkedAt || 0
            )
            >
            ACCESS_CACHE_TIME
        ) {

            return null;

        }


        return data;

    }

    catch {

        return null;

    }

}


function saveAccessCache(
    result
) {

    try {

        localStorage.setItem(

            accessCacheKey(),

            JSON.stringify({

                access:
                    result.access === true,

                status:
                    result.status ||
                    "",

                checkedAt:
                    Date.now()

            })

        );

    }

    catch {}

}


async function verifyAccessAndStart() {

    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL +
                "?action=access&email=" +
                encodeURIComponent(
                    currentUser.email
                ),

                {
                    cache:
                        "no-store"
                }

            );


        const result =
            await response.json();


        saveAccessCache(
            result
        );


        if (
            !result.success ||
            result.access !== true
        ) {

            showLocked(
                "Your Tuklass trial or subscription has expired."
            );

            return;

        }


        loadCalendarCache();


        if (
            calendarData
        ) {

            renderState();

        }


        refreshCalendar();

    }

    catch {

        showLocked(
            "Tuklass could not verify your account right now."
        );

    }

}


/* =========================================================
   CACHE
========================================================= */

function calendarCacheKey() {

    return (
        "writejot_calendar_" +
        String(
            currentUser.email
        )
        .trim()
        .toLowerCase()
    );

}


function loadCalendarCache() {

    try {

        const raw =
            localStorage.getItem(
                calendarCacheKey()
            );


        if (!raw) {

            return;

        }


        calendarData =
            JSON.parse(
                raw
            );

    }

    catch {}

}


function saveCalendarCache() {

    try {

        if (
            calendarData
        ) {

            localStorage.setItem(

                calendarCacheKey(),

                JSON.stringify(
                    calendarData
                )

            );

        }

    }

    catch {}

}



/* =========================================================
   REFRESH
========================================================= */

async function refreshCalendar() {

    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL +
                "?action=calendarStatus&email=" +
                encodeURIComponent(
                    currentUser.email
                ),

                {
                    cache:
                        "no-store"
                }

            );


        const result =
            await response.json();


        /*
         * EXPIRED = LOCK CALENDAR
         */

        if (
            result.accessDenied === true ||
            result.access === false
        ) {

            saveAccessCache({

                access:
                    false,

                status:
                    result.status ||
                    "expired"

            });


            showLocked(
                result.error ||
                "Your Tuklass trial or subscription has expired."
            );


            return;

        }


        if (
            !result.success
        ) {

            return;

        }


        saveAccessCache({

            access:
                true,

            status:
                result.status ||
                "active"

        });


        calendarData =
            result;


        saveCalendarCache();


        renderState();

    }

    catch {

        console.log(
            "Calendar refresh failed."
        );

    }

    finally {

        document
            .getElementById(
                "updateIndicator"
            )
            .style.display =
            "none";

    }

}



/* =========================================================
   LOCK
========================================================= */

function showLocked(
    message
) {

    document
        .getElementById(
            "calendarInterface"
        )
        .style.display =
        "none";


    document
        .getElementById(
            "lockScreen"
        )
        .style.display =
        "flex";


    document
        .getElementById(
            "lockMessage"
        )
        .textContent =
        message ||
        "Your Tuklass access has expired.";

}



/* =========================================================
   STATE
========================================================= */

function renderState() {

    if (
        !calendarData
    ) {

        return;

    }


    const registrationArea =
        document.getElementById(
            "registrationArea"
        );


    const content =
        document.getElementById(
            "calendarContent"
        );


    if (
        !calendarData.registered
    ) {

        content.style.display =
            "none";


        registrationArea.innerHTML =

        `
        <div class="registration-card">

            <h2>
                Register for your class
            </h2>


            <p
                style="
                    color:#718096;
                    margin-bottom:20px;
                "
            >
                Enter your name and section to
                access your official class schedule
                and tests.
            </p>


            <div class="field">

                <label>
                    Name
                </label>

                <input
                    id="registrationName"
                    type="text"
                    value="${escapeHtml(
                        window.TuklassSPA.displayName(
                            currentUser.name
                        ) ||
                        ""
                    )}"
                    placeholder="Your full name"
                >

            </div>


            <div class="field">

                <label>
                    Section
                </label>

                <input
                    id="registrationSection"
                    type="text"
                    placeholder="Example: 10-A"
                >

            </div>


            <button
                id="registerButton"
                class="primary-button"
                type="button"
                onclick="submitRegistration()"
            >
                Register Class
            </button>


            <div
                id="registrationMessage"
                class="form-message"
            ></div>

        </div>
        `;


        return;

    }


    registrationArea.innerHTML =
        "";


    content.style.display =
        "block";


    if (
        !calendarData.approved
    ) {

        document
            .getElementById(
                "statusCard"
            )
            .className =
            "status-card pending";


        document
            .getElementById(
                "statusTitle"
            )
            .textContent =
            "Registration pending";


        document
            .getElementById(
                "statusText"
            )
            .innerHTML =

            `
            Your registration for
            <strong>
                ${escapeHtml(
                    calendarData.registration.section
                )}
            </strong>
            is waiting for approval.
            `;

    }

    else {

        document
            .getElementById(
                "statusCard"
            )
            .className =
            "status-card approved";


        document
            .getElementById(
                "statusTitle"
            )
            .textContent =
            "Class schedule unlocked";


        document
            .getElementById(
                "statusText"
            )
            .innerHTML =

            `
            You are registered in
            <strong>
                ${escapeHtml(
                    calendarData.registration.section
                )}
            </strong>.
            `;

    }


    renderCalendar();

}



/* =========================================================
   CALENDAR RENDER
========================================================= */

function renderCalendar() {

    const grid =
        document.getElementById(
            "calendarGrid"
        );


    const year =
        displayedMonth.getFullYear();


    const month =
        displayedMonth.getMonth();


    document
        .getElementById(
            "monthTitle"
        )
        .textContent =
        displayedMonth.toLocaleDateString(
            undefined,
            {
                month:
                    "long",

                year:
                    "numeric"
            }
        );


    grid.innerHTML =
        "";


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const total =
        Math.ceil(
            (
                firstDay +
                daysInMonth
            ) / 7
        ) * 7;


    for (
        let i = 0;
        i < total;
        i++
    ) {

        const date =
            new Date(
                year,
                month,
                i -
                firstDay +
                1
            );


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "day";


        if (
            date.getMonth() !==
            month
        ) {

            cell.classList.add(
                "other-month"
            );

        }


        const dateString =
            localDateString(
                date
            );


        if (
            dateString ===
            localDateString(
                new Date()
            )
        ) {

            cell.classList.add(
                "today"
            );

        }


        const number =
            document.createElement(
                "div"
            );


        number.className =
            "day-number";


        number.textContent =
            date.getDate();


        cell.appendChild(
            number
        );


        if (
            calendarData.approved
        ) {

            getClassesForDate(
                date
            )
            .forEach(
                function(event) {

                    cell.appendChild(
                        makeChip(
                            event
                        )
                    );

                }
            );


            getTestsForDate(
                dateString
            )
            .forEach(
                function(test) {

                    cell.appendChild(
                        makeChip({

                            type:
                                "test",

                            title:
                                test.title,

                            time:
                                test.startTime

                        })
                    );

                }
            );

        }


        (
            calendarData.personalEvents ||
            []
        )
        .filter(
            function(event) {

                return (
                    event.date ===
                    dateString
                );

            }
        )
        .forEach(
            function(event) {

                cell.appendChild(
                    makeChip(
                        {

                            type:
                                "personal",

                            title:
                                event.title,

                            time:
                                event.startTime,

                            saving:
                                event.saving,

                            failed:
                                event.failed

                        }
                    )
                );

            }
        );


        cell.addEventListener(
            "click",
            function() {

                document
                    .getElementById(
                        "eventDate"
                    )
                    .value =
                    dateString;


                document
                    .getElementById(
                        "eventTitle"
                    )
                    .focus();

            }
        );


        grid.appendChild(
            cell
        );

    }


    renderUpcoming();

}



/* =========================================================
   CLASS EVENTS
========================================================= */

function getClassesForDate(
    date
) {

    const days = [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ];


    const weekday =
        days[
            date.getDay()
        ];


    return (
        calendarData.schedule ||
        []
    )
    .filter(
        function(event) {

            return (
                String(
                    event.day ||
                    ""
                )
                .trim()
                .toLowerCase()
                ===
                weekday.toLowerCase()
            );

        }
    )
    .map(
        function(event) {

            return {

                type:
                    "class",

                title:
                    event.subject,

                time:
                    event.startTime

            };

        }
    );

}


function getTestsForDate(
    date
) {

    return (
        calendarData.tests ||
        []
    )
    .filter(
        function(test) {

            return (
                test.date ===
                date
            );

        }
    );

}



/* =========================================================
   EVENT CHIP
========================================================= */

function makeChip(
    event
) {

    const chip =
        document.createElement(
            "div"
        );


    chip.className =
        "event-chip " +
        (
            event.type ===
                "test"

                ? "event-test"

                : event.type ===
                    "personal"

                    ? "event-personal"

                    : "event-class"
        );


    if (
        event.saving
    ) {

        chip.classList.add(
            "event-saving"
        );

    }


    if (
        event.failed
    ) {

        chip.classList.add(
            "event-failed"
        );

    }


    chip.textContent =
        (
            event.time
                ? event.time +
                  " "
                : ""
        ) +
        (
            event.title ||
            ""
        );


    return chip;

}



/* =========================================================
   UPCOMING
========================================================= */

function renderUpcoming() {

    const box =
        document.getElementById(
            "upcomingEvents"
        );


    const items =
        [];


    const today =
        localDateString(
            new Date()
        );


    if (
        calendarData.approved
    ) {

        (
            calendarData.tests ||
            []
        )
        .filter(
            function(test) {

                return (
                    test.date >=
                    today
                );

            }
        )
        .slice(
            0,
            5
        )
        .forEach(
            function(test) {

                items.push({

                    date:
                        test.date,

                    title:
                        test.title,

                    meta:
                        test.subject,

                    color:
                        "#dc2626"

                });

            }
        );

    }


    (
        calendarData.personalEvents ||
        []
    )
    .filter(
        function(event) {

            return (
                event.date >=
                today
            );

        }
    )
    .forEach(
        function(event) {

            items.push({

                date:
                    event.date,

                title:
                    event.title,

                meta:
                    event.startTime,

                color:
                    "#16834a",

                eventId:
                    event.eventId,

                saving:
                    event.saving

            });

        }
    );


    items.sort(
        function(a,b) {

            return (
                a.date.localeCompare(
                    b.date
                )
            );

        }
    );


    if (
        !items.length
    ) {

        box.innerHTML =

            `
            <div
                style="
                    color:#8a94a6;
                    font-size:13px;
                "
            >
                Nothing upcoming.
            </div>
            `;


        return;

    }


    box.innerHTML =
        items
            .slice(
                0,
                10
            )
            .map(
                function(item) {

                    return `

                    <div
                        class="upcoming-event"
                    >

                        <div
                            class="upcoming-date"
                        >
                            ${escapeHtml(
                                prettyDate(
                                    item.date
                                )
                            )}
                        </div>


                        <div
                            class="upcoming-title"
                            style="
                                color:${item.color};
                            "
                        >
                            ${escapeHtml(
                                item.title
                            )}
                        </div>


                        <div
                            class="upcoming-meta"
                        >
                            ${escapeHtml(
                                item.meta ||
                                ""
                            )}

                            ${
                                item.saving
                                    ? " · Saving..."
                                    : ""
                            }

                        </div>


                        ${
                            item.eventId
                                ? `
                                    <button
                                        class="personal-delete"
                                        type="button"
                                        onclick="deleteEvent(
                                            '${escapeHtml(
                                                item.eventId
                                            )}'
                                        )"
                                    >
                                        Delete
                                    </button>
                                  `
                                : ""
                        }

                    </div>

                    `;

                }
            )
            .join("");

}



/* =========================================================
   OPTIMISTIC ADD EVENT
========================================================= */

async function addEvent() {

    const title =
        document
            .getElementById(
                "eventTitle"
            )
            .value
            .trim();


    const date =
        document
            .getElementById(
                "eventDate"
            )
            .value;


    const startTime =
        document
            .getElementById(
                "eventStart"
            )
            .value;


    const endTime =
        document
            .getElementById(
                "eventEnd"
            )
            .value;


    const description =
        document
            .getElementById(
                "eventDescription"
            )
            .value
            .trim();


    const message =
        document.getElementById(
            "eventMessage"
        );


    if (
        !title ||
        !date
    ) {

        message.textContent =
            "Enter a title and date.";

        message.style.color =
            "#dc2626";

        return;

    }


    /*
     * Temporary event appears
     * immediately.
     */

    const temporaryId =
        "temp_" +
        Date.now();


    if (
        !calendarData.personalEvents
    ) {

        calendarData.personalEvents =
            [];

    }


    const temporaryEvent = {

        eventId:
            temporaryId,

        title:
            title,

        date:
            date,

        startTime:
            startTime,

        endTime:
            endTime,

        description:
            description,

        saving:
            true,

        temporary:
            true

    };


    calendarData.personalEvents.push(
        temporaryEvent
    );


    /*
     * Immediately update calendar.
     */

    renderCalendar();


    saveCalendarCache();


    /*
     * Clear fields immediately.
     */

    document
        .getElementById(
            "eventTitle"
        )
        .value =
        "";


    document
        .getElementById(
            "eventStart"
        )
        .value =
        "";


    document
        .getElementById(
            "eventEnd"
        )
        .value =
        "";


    document
        .getElementById(
            "eventDescription"
        )
        .value =
        "";


    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify({

                            action:
                                "addPersonalEvent",

                            email:
                                currentUser.email,

                            title:
                                title,

                            date:
                                date,

                            startTime:
                                startTime,

                            endTime:
                                endTime,

                            description:
                                description

                        })

                }

            );


        const result =
            await response.json();


        if (
            result.accessDenied ||
            result.access === false
        ) {

            showLocked(
                "Your Tuklass access has expired."
            );

            return;

        }


        if (
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Could not save event."
            );

        }


        /*
         * Replace temporary event
         * with server-confirmed event.
         */

        calendarData.personalEvents =
            calendarData.personalEvents
                .filter(
                    function(event) {

                        return (
                            event.eventId !==
                            temporaryId
                        );

                    }
                );


        calendarData.personalEvents.push({

            eventId:
                result.eventId,

            title:
                result.title,

            date:
                result.date,

            startTime:
                result.startTime,

            endTime:
                result.endTime,

            description:
                result.description

        });


        saveCalendarCache();


        renderCalendar();

    }

    catch (error) {

        /*
         * Remove the optimistic event.
         */

        calendarData.personalEvents =
            calendarData.personalEvents
                .filter(
                    function(event) {

                        return (
                            event.eventId !==
                            temporaryId
                        );

                    }
                );


        saveCalendarCache();


        renderCalendar();


        message.textContent =
            error.message ||
            "Could not save event.";

        message.style.color =
            "#dc2626";

    }

}



/* =========================================================
   OPTIMISTIC DELETE
========================================================= */

async function deleteEvent(
    eventId
) {

    const existing =
        calendarData.personalEvents
            .find(
                function(event) {

                    return (
                        event.eventId ===
                        eventId
                    );

                }
            );


    if (!existing) {

        return;

    }


    const originalEvents =
        calendarData.personalEvents.slice();


    /*
     * Remove immediately.
     */

    calendarData.personalEvents =
        calendarData.personalEvents
            .filter(
                function(event) {

                    return (
                        event.eventId !==
                        eventId
                    );

                }
            );


    renderCalendar();


    saveCalendarCache();


    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify({

                            action:
                                "deletePersonalEvent",

                            email:
                                currentUser.email,

                            eventId:
                                eventId

                        })

                }

            );


        const result =
            await response.json();


        if (
            result.accessDenied ||
            result.access === false
        ) {

            showLocked(
                "Your Tuklass access has expired."
            );

            return;

        }


        if (
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Could not delete event."
            );

        }

    }

    catch (error) {

        /*
         * Restore event if deletion failed.
         */

        calendarData.personalEvents =
            originalEvents;


        renderCalendar();


        saveCalendarCache();


        alert(
            error.message ||
            "Could not delete event."
        );

    }

}



/* =========================================================
   REGISTRATION
========================================================= */

async function submitRegistration() {

    const name =
        document
            .getElementById(
                "registrationName"
            )
            .value
            .trim();


    const section =
        document
            .getElementById(
                "registrationSection"
            )
            .value
            .trim();


    const message =
        document.getElementById(
            "registrationMessage"
        );


    if (
        !name ||
        !section
    ) {

        message.textContent =
            "Enter your name and section.";

        return;

    }


    const button =
        document.getElementById(
            "registerButton"
        );


    button.disabled =
        true;


    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify({

                            action:
                                "registerClass",

                            email:
                                currentUser.email,

                            name:
                                name,

                            section:
                                section

                        })

                }

            );


        const result =
            await response.json();


        if (
            result.accessDenied
        ) {

            showLocked(
                "Your Tuklass access has expired."
            );

            return;

        }


        if (
            !result.success
        ) {

            throw new Error(
                result.error
            );

        }


        await refreshCalendar();

    }

    catch (error) {

        message.textContent =
            error.message;

        message.style.color =
            "#dc2626";

    }

    finally {

        button.disabled =
            false;

    }

}



/* =========================================================
   NAVIGATION
========================================================= */

function changeMonth(
    amount
) {

    displayedMonth.setMonth(
        displayedMonth.getMonth() +
        amount
    );


    renderCalendar();

}


function goToToday() {

    displayedMonth =
        new Date();


    displayedMonth.setDate(
        1
    );


    renderCalendar();

}



/* =========================================================
   HELPERS
========================================================= */

function localDateString(
    date
) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        )
        .padStart(
            2,
            "0"
        )

    ].join("-");

}


function prettyDate(
    value
) {

    const date =
        new Date(
            value +
            "T00:00:00"
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        undefined,
        {

            weekday:
                "short",

            month:
                "short",

            day:
                "numeric"

        }
    );

}


function escapeHtml(
    value
) {

    return String(
        value ||
        ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}

    async function spaInit() {
        window.changeMonth = changeMonth;
        window.goToToday = goToToday;
        window.addEvent = addEvent;
        window.submitRegistration = submitRegistration;
        window.deletePersonalEvent = deletePersonalEvent;
        await init();
    }

    function cleanup() {
        try { delete window.changeMonth; } catch {}
        try { delete window.goToToday; } catch {}
        try { delete window.addEvent; } catch {}
        try { delete window.submitRegistration; } catch {}
        try { delete window.deletePersonalEvent; } catch {}
    }

    return {
        init: spaInit,
        cleanup: cleanup
    };
})();



window.TuklassReminders = (function () {
const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzm5LpGtEla7cszMG0OIxZqf_pwuxJnOSmpEwUkqsiz886ql12hDFBHdxFBCWYyVYxf/exec";


let currentUser =
    null;

let data =
    null;

let reminders =
    [];

let refreshTimer =
    null;


/* =========================================================
   START
========================================================= */

function init() {

        const saved =
            localStorage.getItem(
                "writejotUser"
            );


        if (!saved) {

            showMessage(
                "Please sign in to Tuklass first."
            );

            return;

        }


        try {

            currentUser =
                JSON.parse(
                    saved
                );

        }

        catch {

            showMessage(
                "Your Tuklass session could not be loaded."
            );

            return;

        }


        /*
         * Load cached reminders instantly.
         */

        loadCache();


        /*
         * Render cached information immediately.
         */

        if (
            data
        ) {

            render();

        }


        /*
         * Refresh from server.
         */

        verifyAccess();

}


/* =========================================================
   ACCESS CACHE
========================================================= */

function accessCacheKey() {

    return (
        "writejot_access_" +
        currentUser.email
            .trim()
            .toLowerCase()
    );

}


function getAccessCache() {

    try {

        const raw =
            localStorage.getItem(
                accessCacheKey()
            );


        if (!raw) {
            return null;
        }


        const result =
            JSON.parse(
                raw
            );


        if (
            Date.now() -
            Number(
                result.checkedAt ||
                0
            )
            >
            5 * 60 * 1000
        ) {

            return null;

        }


        return result;

    }

    catch {

        return null;

    }

}


function saveAccessCache(
    result
) {

    try {

        localStorage.setItem(

            accessCacheKey(),

            JSON.stringify({

                access:
                    result.access === true,

                status:
                    result.status ||
                    "",

                checkedAt:
                    Date.now()

            })

        );

    }

    catch {}

}


/* =========================================================
   ACCESS
========================================================= */

async function verifyAccess() {

    const cached =
        getAccessCache();


    /*
     * Don't blank a cached page while
     * checking the server.
     */

    if (
        cached &&
        cached.access === true
    ) {

        if (
            data
        ) {

            render();

        }

    }


    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL +
                "?action=access&email=" +
                encodeURIComponent(
                    currentUser.email
                ),

                {
                    cache:
                        "no-store"
                }

            );


        const result =
            await response.json();


        saveAccessCache(
            result
        );


        if (
            !result.success ||
            result.access !== true
        ) {

            showLock(
                "Your Tuklass trial or subscription has expired."
            );

            return;

        }


        await refreshReminders();

    }

    catch {

        /*
         * Keep cached content visible if
         * the server is temporarily slow.
         */

        if (
            !data
        ) {

            showMessage(
                "Could not connect to Tuklass."
            );

        }

    }

}


/* =========================================================
   REFRESH REMINDERS
========================================================= */

async function refreshReminders() {

    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL +
                "?action=reminders&email=" +
                encodeURIComponent(
                    currentUser.email
                ),

                {
                    cache:
                        "no-store"
                }

            );


        const result =
            await response.json();


        if (
            result.accessDenied === true ||
            result.access === false
        ) {

            saveAccessCache({

                access:
                    false,

                status:
                    result.status ||
                    "expired"

            });


            showLock(
                "Your Tuklass trial or subscription has expired."
            );


            return;

        }


        if (
            !result.success
        ) {

            return;

        }


        data =
            result;


        reminders =
            Array.isArray(
                result.reminders
            )
                ? result.reminders
                : [];


        saveCache();


        render();

        startRefreshTimer();

    }

    catch {

        console.log(
            "Reminder refresh failed."
        );

    }

}


/* =========================================================
   AUTO REFRESH
========================================================= */

function startRefreshTimer() {

    if (
        refreshTimer
    ) {

        clearInterval(
            refreshTimer
        );

    }


    refreshTimer =
        setInterval(
            refreshReminders,
            30000
        );

}



/* =========================================================
   CACHE
========================================================= */

function cacheKey() {

    return (
        "writejot_reminders_" +
        currentUser.email
            .trim()
            .toLowerCase()
    );

}


function loadCache() {

    try {

        const raw =
            localStorage.getItem(
                cacheKey()
            );


        if (!raw) {
            return;
        }


        const cached =
            JSON.parse(
                raw
            );


        if (
            !cached
        ) {

            return;

        }


        data =
            cached;


        reminders =
            Array.isArray(
                cached.reminders
            )
                ? cached.reminders
                : [];

    }

    catch {}

}


function saveCache() {

    try {

        if (
            !data
        ) {
            return;
        }


        localStorage.setItem(

            cacheKey(),

            JSON.stringify({

                ...data,

                reminders:
                    reminders

            })

        );

    }

    catch {}

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    const content =
        document.getElementById(
            "content"
        );


    if (!data) {
        return;
    }


    /*
     * No class registration.
     */

    if (
        !data.registered
    ) {

        content.innerHTML =

        `
        <div class="center">

            <div
                style="
                    font-size:48px;
                    margin-bottom:10px;
                "
            >
                <img src="images/CalendarA.png" alt="" style="width:44px;height:44px;object-fit:contain;">
            </div>


            <h2>
                Register your class first
            </h2>


            <p>
                Reminders use the same class registration
                as Calendar. You only need to register
                your section once.
            </p>


            <a
                href="calendar.html"
                class="center-button"
            >
                Register on Calendar
            </a>

        </div>
        `;


        return;

    }


    /*
     * Registration pending.
     */

    if (
        !data.approved
    ) {

        content.innerHTML =

        `
        <div class="center">

            <div
                style="
                    font-size:48px;
                    margin-bottom:10px;
                "
            >
                <img src="images/CalendarA.png" alt="" style="width:44px;height:44px;object-fit:contain;">
            </div>


            <h2>
                Class registration pending
            </h2>


            <p>
                Your registered section is
                <strong>
                    ${escapeHtml(
                        data.registration.section
                    )}
                </strong>.
                Reminders will appear after your
                registration is approved.
            </p>


            <a
                href="calendar.html"
                class="center-button"
            >
                Open Calendar
            </a>

        </div>
        `;


        return;

    }


    /*
     * Main page.
     */

    content.innerHTML =

    `
    <div class="class-card">

        <div class="class-label">
            Your registered class
        </div>


        <div class="class-name">
            ${escapeHtml(
                data.registration.section
            )}
        </div>

    </div>


    <div class="layout">


        <div class="card">

            <div class="list-header">

                <strong>
                    <img src="images/BelleA.png" alt="" style="width:26px;height:26px;object-fit:contain;vertical-align:middle;margin-right:8px;"> Reminders
                </strong>


                <span
                    style="
                        color:#8a94a6;
                        font-size:12px;
                    "
                >
                    ${reminders.length}
                </span>

            </div>


            <div
                id="reminderList"
            ></div>

        </div>



        <div class="card form-card">

            <h2>
                Add Personal Reminder
            </h2>


            <div class="field">

                <label>
                    Title
                </label>


                <input
                    id="reminderTitle"
                    type="text"
                    maxlength="100"
                    placeholder="e.g. Finish math homework"
                >

            </div>


            <div class="field">

                <label>
                    Date
                </label>


                <input
                    id="reminderDate"
                    type="date"
                >

            </div>


            <div class="field">

                <label>
                    Time
                </label>


                <input
                    id="reminderTime"
                    type="time"
                >

            </div>


            <div class="field">

                <label>
                    Description
                </label>


                <textarea
                    id="reminderDescription"
                    maxlength="500"
                    placeholder="Optional"
                ></textarea>

            </div>


            <button
                id="addReminderButton"
                class="primary-button"
                type="button"
                onclick="addPersonalReminder()"
            >
                + Add Reminder
            </button>


            <div
                id="formMessage"
                class="form-message"
            ></div>

        </div>

    </div>
    `;


    const dateInput =
        document.getElementById(
            "reminderDate"
        );


    if (
        dateInput &&
        !dateInput.value
    ) {

        dateInput.value =
            getToday();

    }


    renderReminderList();

}



/* =========================================================
   RENDER REMINDERS
========================================================= */

function renderReminderList() {

    const list =
        document.getElementById(
            "reminderList"
        );


    if (!list) {
        return;
    }


    if (
        !reminders.length
    ) {

        list.innerHTML =

        `
        <div class="empty">
            No reminders yet.
        </div>
        `;


        return;

    }


    list.innerHTML =
        reminders
            .map(
                function(reminder) {

                    const parts =
                        getDateParts(
                            reminder.date
                        );


                    const isClass =
                        String(
                            reminder.type ||
                            ""
                        )
                        .toLowerCase()
                        ===
                        "class";


                    return `

                    <div
                        class="
                            reminder
                            ${
                                reminder.optimistic
                                    ? "saving"
                                    : ""
                            }
                        "
                    >

                        <div class="date-box">

                            <span
                                class="date-month"
                            >
                                ${escapeHtml(
                                    parts.month
                                )}
                            </span>


                            <span
                                class="date-day"
                            >
                                ${escapeHtml(
                                    parts.day
                                )}
                            </span>

                        </div>


                        <div
                            class="reminder-main"
                        >

                            <div
                                class="reminder-title"
                            >
                                ${escapeHtml(
                                    reminder.title
                                )}
                            </div>


                            <div
                                class="reminder-meta"
                            >
                                ${
                                    reminder.time
                                        ? escapeHtml(
                                            reminder.time
                                        )
                                        : "All day"
                                }
                            </div>


                            ${
                                reminder.description
                                    ? `
                                        <div
                                            class="
                                                reminder-description
                                            "
                                        >
                                            ${escapeHtml(
                                                reminder.description
                                            )}
                                        </div>
                                      `
                                    : ""
                            }


                            <span
                                class="
                                    tag
                                    ${
                                        isClass
                                            ? "tag-class"
                                            : "tag-personal"
                                    }
                                "
                            >
                                ${
                                    isClass
                                        ? "CLASS"
                                        : "PERSONAL"
                                }
                            </span>

                        </div>


                        <div>

                            ${
                                reminder.optimistic

                                    ? `
                                        <span
                                            style="
                                                color:#8a94a6;
                                                font-size:10px;
                                            "
                                        >
                                            Saving...
                                        </span>
                                      `

                                    : (
                                        !isClass &&
                                        reminder.reminderId
                                    )

                                        ? `
                                            <button
                                                type="button"
                                                class="delete-button"
                                                onclick="deletePersonalReminder(
                                                    '${escapeHtml(
                                                        reminder.reminderId
                                                    )}'
                                                )"
                                            >
                                                Delete
                                            </button>
                                          `

                                        : ""
                            }

                        </div>

                    </div>

                    `;

                }
            )
            .join("");

}



/* =========================================================
   ADD PERSONAL REMINDER
========================================================= */

async function addPersonalReminder() {

    const title =
        document
            .getElementById(
                "reminderTitle"
            )
            .value
            .trim();


    const date =
        document
            .getElementById(
                "reminderDate"
            )
            .value;


    const time =
        document
            .getElementById(
                "reminderTime"
            )
            .value;


    const description =
        document
            .getElementById(
                "reminderDescription"
            )
            .value
            .trim();


    const button =
        document.getElementById(
            "addReminderButton"
        );


    const message =
        document.getElementById(
            "formMessage"
        );


    if (
        !title ||
        !date
    ) {

        message.textContent =
            "Please enter a title and date.";

        message.style.color =
            "#dc2626";

        return;

    }


    const temporaryId =
        "temp_" +
        Date.now();


    /*
     * OPTIMISTIC UI:
     * show it immediately.
     */

    const optimisticReminder = {

        reminderId:
            temporaryId,

        title:
            title,

        date:
            date,

        time:
            time,

        description:
            description,

        type:
            "personal",

        section:
            data.registration.section,

        optimistic:
            true

    };


    reminders.push(
        optimisticReminder
    );


    renderReminderList();


    saveCache();


    /*
     * Clear the form immediately.
     */

    document
        .getElementById(
            "reminderTitle"
        )
        .value =
        "";


    document
        .getElementById(
            "reminderTime"
        )
        .value =
        "";


    document
        .getElementById(
            "reminderDescription"
        )
        .value =
        "";


    message.textContent =
        "Reminder added.";

    message.style.color =
        "#16834a";


    button.disabled =
        true;


    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify({

                            action:
                                "addPersonalReminder",

                            email:
                                currentUser.email,

                            title:
                                title,

                            date:
                                date,

                            time:
                                time,

                            description:
                                description

                        })

                }

            );


        const result =
            await response.json();


        if (
            result.accessDenied ||
            result.access === false
        ) {

            throw new Error(
                "Your Tuklass access has expired."
            );

        }


        if (
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Could not save reminder."
            );

        }


        reminders =
            reminders.filter(
                function(reminder) {

                    return (
                        reminder.reminderId !==
                        temporaryId
                    );

                }
            );


        reminders.push(
            result.reminder
        );


        saveCache();


        renderReminderList();

    }

    catch (error) {

        /*
         * Remove optimistic reminder
         * if save failed.
         */

        reminders =
            reminders.filter(
                function(reminder) {

                    return (
                        reminder.reminderId !==
                        temporaryId
                    );

                }
            );


        saveCache();


        renderReminderList();


        message.textContent =
            error.message ||
            "Could not save reminder.";

        message.style.color =
            "#dc2626";

    }

    finally {

        button.disabled =
            false;

    }

}



/* =========================================================
   DELETE PERSONAL REMINDER
========================================================= */

async function deletePersonalReminder(
    reminderId
) {

    const previous =
        reminders.slice();


    /*
     * Remove immediately.
     */

    reminders =
        reminders.filter(
            function(reminder) {

                return (
                    reminder.reminderId !==
                    reminderId
                );

            }
        );


    renderReminderList();


    saveCache();


    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify({

                            action:
                                "deletePersonalReminder",

                            email:
                                currentUser.email,

                            reminderId:
                                reminderId

                        })

                }

            );


        const result =
            await response.json();


        if (
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Could not delete reminder."
            );

        }

    }

    catch (error) {

        reminders =
            previous;


        renderReminderList();


        saveCache();


        alert(
            error.message ||
            "Could not delete reminder."
        );

    }

}



/* =========================================================
   LOCK
========================================================= */

function showLock(
    message
) {

    if (
        refreshTimer
    ) {

        clearInterval(
            refreshTimer
        );

    }


    document
        .getElementById(
            "content"
        )
        .innerHTML =

        `
        <div class="center">

            <div
                style="
                    font-size:50px;
                    margin-bottom:10px;
                "
            >
                <img src="images/BelleB.png" alt="" style="width:44px;height:44px;object-fit:contain;">
            </div>


            <h2>
                Reminders unavailable
            </h2>


            <p>
                ${escapeHtml(
                    message
                )}
            </p>


            <a
                class="center-button"
                href="index.html"
            >
                Back to Dashboard
            </a>

        </div>
        `;

}


function showMessage(
    message
) {

    document
        .getElementById(
            "content"
        )
        .innerHTML =

        `
        <div class="center">

            <p>
                ${escapeHtml(
                    message
                )}
            </p>


            <a
                class="center-button"
                href="index.html"
            >
                Back to Dashboard
            </a>

        </div>
        `;

}



/* =========================================================
   DATE HELPERS
========================================================= */

function getDateParts(
    value
) {

    if (!value) {

        return {

            month:
                "",

            day:
                ""

        };

    }


    const date =
        new Date(
            value +
            "T00:00:00"
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return {

            month:
                "",

            day:
                ""

        };

    }


    return {

        month:
            date.toLocaleDateString(
                undefined,
                {
                    month:
                        "short"
                }
            ),

        day:
            date.toLocaleDateString(
                undefined,
                {
                    day:
                        "numeric"
                }
            )

    };

}


function getToday() {

    const date =
        new Date();


    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        )
        .padStart(
            2,
            "0"
        )

    ].join("-");

}



/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ||
        ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}

    function spaInit() {
        window.addPersonalReminder = addPersonalReminder;
        window.deletePersonalReminder = deletePersonalReminder;
        init();
    }

    function cleanup() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
        try { delete window.addPersonalReminder; } catch {}
        try { delete window.deletePersonalReminder; } catch {}
    }

    return {
        init: spaInit,
        cleanup: cleanup
    };
})();



window.TuklassMessages = (function () {
/* =========================================================
   CONFIG
========================================================= */

const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzm5LpGtEla7cszMG0OIxZqf_pwuxJnOSmpEwUkqsiz886ql12hDFBHdxFBCWYyVYxf/exec";


const CACHE_PREFIX =
    "writejot_conversations_";


const REFRESH_INTERVAL =
    15000;


let currentUser =
    null;


let conversations =
    [];


let refreshTimer =
    null;


/* =========================================================
   START
========================================================= */

async function initialize() {

    const savedUser =
        localStorage.getItem(
            "writejotUser"
        );


    if (
        !savedUser
    ) {

        showError(
            "Please sign in to Tuklass first."
        );

        return;

    }


    try {

        currentUser =
            JSON.parse(
                savedUser
            );

    }

    catch {

        localStorage.removeItem(
            "writejotUser"
        );


        showError(
            "Your Tuklass session could not be loaded."
        );


        return;

    }


    /*
     * CACHE FIRST.
     *
     * This means conversations can appear
     * immediately without waiting for Apps Script.
     */

    loadCache();


    if (
        conversations.length
    ) {

        renderConversations();

    }


    /*
     * Fresh data in background.
     */

    await loadConversations();


    startRefresh();

}


/* =========================================================
   CACHE
========================================================= */

function getCacheKey() {

    return (
        CACHE_PREFIX +
        normalizeEmail(
            currentUser.email
        )
    );

}


function loadCache() {

    try {

        const raw =
            localStorage.getItem(
                getCacheKey()
            );


        if (
            !raw
        ) {

            return;

        }


        const cached =
            JSON.parse(
                raw
            );


        if (
            !Array.isArray(
                cached.conversations
            )
        ) {

            return;

        }


        conversations =
            cached.conversations.slice();

    }

    catch {

        conversations =
            [];

    }

}


function saveCache() {

    try {

        localStorage.setItem(

            getCacheKey(),

            JSON.stringify({

                savedAt:
                    Date.now(),

                conversations:
                    conversations

            })

        );

    }

    catch {}

}


/* =========================================================
   LOAD CONVERSATIONS
========================================================= */

async function loadConversations() {

    try {

        const response =
            await fetch(

                APPS_SCRIPT_URL +
                "?action=conversations" +
                "&email=" +
                encodeURIComponent(
                    currentUser.email
                ),

                {
                    cache:
                        "no-store"
                }

            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Server returned " +
                response.status
            );

        }


        const result =
            await response.json();


        if (
            result.accessDenied ===
            true
        ) {

            showError(
                result.error ||
                "Your Tuklass access has expired."
            );

            return;

        }


        if (
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Could not load conversations."
            );

        }


        conversations =
            Array.isArray(
                result.conversations
            )
                ? result.conversations
                : [];


        saveCache();


        renderConversations();

    }

    catch (error) {

        console.error(
            "Conversation loading error:",
            error
        );


        /*
         * If cache exists, KEEP IT.
         */

        if (
            conversations.length
        ) {

            renderConversations();

            return;

        }


        showError(
            "Could not load your messages."
        );

    }

}


/* =========================================================
   AUTO REFRESH
========================================================= */

function startRefresh() {

    if (
        refreshTimer
    ) {

        clearInterval(
            refreshTimer
        );

    }


    refreshTimer =
        setInterval(
            function() {

                if (
                    document.visibilityState ===
                    "visible"
                ) {

                    loadConversations();

                }

            },

            REFRESH_INTERVAL
        );

}


/* =========================================================
   RENDER
========================================================= */

function renderConversations() {

    const list =
        document.getElementById(
            "conversationList"
        );


    /*
     * Explicitly remove any accidental
     * height restriction.
     */

    list.style.height =
        "auto";


    list.style.maxHeight =
        "none";


    list.style.overflow =
        "visible";


    if (
        !conversations.length
    ) {

        list.innerHTML =

            `
            <div
                class="messages-empty"
            >

                <div
                    style="
                        font-size:42px;
                        margin-bottom:12px;
                    "
                >
                    <img src="images/MessageA.png" alt="" style="width:48px;height:48px;object-fit:contain;">
                </div>


                <strong>
                    No conversations yet.
                </strong>


                <div
                    style="
                        margin-top:6px;
                    "
                >
                    Search for a student to
                    start a conversation.
                </div>

            </div>
            `;


        updateUnreadTotal();


        return;

    }


    list.innerHTML =
        conversations
            .map(
                function(
                    conversation
                ) {

                    return buildConversation(
                        conversation
                    );

                }
            )
            .join("");


    updateUnreadTotal();

}


/* =========================================================
   BUILD CONVERSATION
========================================================= */

function buildConversation(
    conversation
) {

    const username =
        normalizeUsername(
            conversation.username
        );


    const name =
        conversation.name ||
        "Tuklass User";


    const picture =
        conversation.profilePicture ||
        "images/Logo3.1.png";


    const preview =
        conversation.lastMessage ||
        "No messages yet.";


    const unread =
        Math.max(
            0,
            Number(
                conversation.unreadCount ||
                0
            )
        );


    const unreadClass =
        unread > 0
            ? "unread"
            : "";


    const time =
        formatConversationTime(
            conversation.timestamp
        );


    return `

        <div
            class="
                conversation
                ${unreadClass}
            "
            role="button"
            tabindex="0"

            onclick="
                openConversation(
                    '${escapeJs(
                        username
                    )}'
                )
            "

            onkeydown="
                conversationKey(
                    event,
                    '${escapeJs(
                        username
                    )}'
                )
            "
        >


            <img
                class="conversation-picture"
                src="${escapeHtml(
                    picture
                )}"
                alt=""
                loading="lazy"

                onerror="
                    this.src='images/Logo3.1.png';
                "
            >


            <div
                class="conversation-content"
            >

                <div
                    class="conversation-top"
                >

                    <div
                        class="conversation-name"
                    >
                        ${escapeHtml(
                            name
                        )}
                    </div>


                    <div
                        class="
                            conversation-username
                        "
                    >
                        @${escapeHtml(
                            username
                        )}
                    </div>

                </div>


                <div
                    class="
                        conversation-preview
                    "
                >
                    ${escapeHtml(
                        preview
                    )}
                </div>

            </div>


            <div
                class="conversation-right"
            >

                <div
                    class="conversation-time"
                >
                    ${escapeHtml(
                        time
                    )}
                </div>


                <div
                    class="
                        unread-badge
                        ${
                            unread > 0
                                ? ""
                                : "hidden"
                        }
                    "
                >
                    ${
                        unread > 99
                            ? "99+"
                            : unread
                    }
                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   OPEN CHAT
========================================================= */

function openConversation(
    username
) {

    const cleaned =
        normalizeUsername(
            username
        );


    if (
        !cleaned
    ) {

        return;

    }


    window.location.href =
        "chat.html?username=" +
        encodeURIComponent(
            cleaned
        );

}


function conversationKey(
    event,
    username
) {

    if (
        event.key ===
            "Enter" ||
        event.key ===
            " "
    ) {

        event.preventDefault();


        openConversation(
            username
        );

    }

}


/* =========================================================
   TOTAL UNREAD
========================================================= */

function updateUnreadTotal() {

    const badge =
        document.getElementById(
            "unreadTotal"
        );


    let total =
        0;


    conversations.forEach(
        function(
            conversation
        ) {

            const count =
                Number(
                    conversation.unreadCount ||
                    0
                );


            if (
                Number.isFinite(
                    count
                ) &&
                count > 0
            ) {

                total +=
                    count;

            }

        }
    );


    if (
        total <= 0
    ) {

        badge.textContent =
            "";

        badge.classList.add(
            "hidden"
        );

        return;

    }


    badge.classList.remove(
        "hidden"
    );


    badge.textContent =
        total > 99
            ? "99+"
            : String(
                total
            );

}


/* =========================================================
   TIME
========================================================= */

function formatConversationTime(
    timestamp
) {

    if (
        !timestamp
    ) {

        return "";

    }


    const date =
        new Date(
            timestamp
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const now =
        new Date();


    if (
        date.toDateString() ===
        now.toDateString()
    ) {

        return date.toLocaleTimeString(
            [],
            {
                hour:
                    "numeric",

                minute:
                    "2-digit"
            }
        );

    }


    const difference =
        now.getTime() -
        date.getTime();


    const day =
        24 *
        60 *
        60 *
        1000;


    if (
        difference >= 0 &&
        difference <
            7 * day
    ) {

        return date.toLocaleDateString(
            [],
            {
                weekday:
                    "short"
            }
        );

    }


    return date.toLocaleDateString(
        [],
        {
            month:
                "short",

            day:
                "numeric"
        }
    );

}


/* =========================================================
   HELPERS
========================================================= */

function normalizeUsername(
    username
) {

    return String(
        username ||
        ""
    )
    .trim()
    .toLowerCase()
    .replace(
        /^@/,
        ""
    );

}


function normalizeEmail(
    email
) {

    return String(
        email ||
        ""
    )
    .trim()
    .toLowerCase();

}


function escapeHtml(
    value
) {

    return String(
        value ||
        ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function escapeJs(
    value
) {

    return String(
        value ||
        ""
    )
    .replace(
        /\\/g,
        "\\\\"
    )
    .replace(
        /'/g,
        "\\'"
    )
    .replace(
        /"/g,
        '\\"'
    )
    .replace(
        /\r/g,
        "\\r"
    )
    .replace(
        /\n/g,
        "\\n"
    );

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    document
        .getElementById(
            "conversationList"
        )
        .innerHTML =

        `
        <div
            class="messages-error"
        >

            ${escapeHtml(
                message
            )}

            <br><br>

            <a
                href="index.html"
                class="dashboard-link"
            >
                Back to Dashboard
            </a>

        </div>
        `;

}

    async function spaInit() {
        window.openConversation = openConversation;
        window.conversationKey = conversationKey;
        await initialize();
    }

    function cleanup() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
        try { delete window.openConversation; } catch {}
        try { delete window.conversationKey; } catch {}
    }

    return {
        init: spaInit,
        cleanup: cleanup
    };
})();



(function () {
    "use strict";

    const ROUTE_URLS = {
        home: "index.html",
        catalog: "catalog.html",
        calendar: "calendar.html",
        reminders: "reminders.html",
        messages: "messages.html"
    };

    const ROUTE_TITLES = {
        home: "Tuklass | Your class, organized.",
        catalog: "Tuklass | Notes Catalog",
        calendar: "Tuklass | Calendar",
        reminders: "Tuklass | Reminders",
        messages: "Tuklass | Messages"
    };

    let homeMarkup = "";
    let currentRoute = "home";
    let started = false;
    let navigating = false;
    let originalShowDashboard = null;

    const ROUTE_TEMPLATES = {

        catalog: `
            <div class="tuklass-route route-catalog">
                <div class="route-head">
                    <div>
                        <div class="route-kicker">Study materials</div>
                        <h1>Notes Catalog</h1>
                        <p>Browse notes and lesson materials shared through Tuklass.</p>
                    </div>
                    <div class="route-head-icon">
                        <img src="images/CatalogB.png" alt="">
                    </div>
                </div>

                <div class="catalog-search-wrap">
                    <input
                        id="spaCatalogSearch"
                        class="catalog-search"
                        type="text"
                        placeholder="Search notes, subjects, or topics..."
                        autocomplete="off"
                    >
                </div>

                <div id="spaCatalogNoResults" class="route-empty" hidden>
                    <strong>No notes found</strong>
                    <span>Try a different search term.</span>
                </div>

                <section class="catalog-subject">
                    <div class="catalog-subject-head">
                        <div class="catalog-subject-title">
                            <div class="route-small-icon">
                                <img src="images/CatalogA.png" alt="">
                            </div>
                            <h2>Mathematics</h2>
                        </div>
                        <span class="route-count">2 materials</span>
                    </div>

                    <div class="catalog-grid">
                        <article class="catalog-card" data-catalog="algebra mathematics">
                            <div class="catalog-card-top">
                                <div class="catalog-card-icon">
                                    <img src="images/CatalogA.png" alt="">
                                </div>
                                <div>
                                    <div class="catalog-label">Mathematics</div>
                                    <h3>Algebra Notes</h3>
                                </div>
                            </div>
                            <p>Algebra study notes and formulas.</p>
                            <a href="#" class="spa-black-button" onclick="event.preventDefault();">View Notes</a>
                        </article>

                        <article class="catalog-card" data-catalog="geometry mathematics">
                            <div class="catalog-card-top">
                                <div class="catalog-card-icon">
                                    <img src="images/CatalogA.png" alt="">
                                </div>
                                <div>
                                    <div class="catalog-label">Mathematics</div>
                                    <h3>Geometry Notes</h3>
                                </div>
                            </div>
                            <p>Geometry concepts and examples.</p>
                            <a href="#" class="spa-black-button" onclick="event.preventDefault();">View Notes</a>
                        </article>
                    </div>
                </section>

                <section class="catalog-subject">
                    <div class="catalog-subject-head">
                        <div class="catalog-subject-title">
                            <div class="route-small-icon">
                                <img src="images/CatalogA.png" alt="">
                            </div>
                            <h2>Science</h2>
                        </div>
                        <span class="route-count">2 materials</span>
                    </div>

                    <div class="catalog-grid">
                        <article class="catalog-card" data-catalog="biology science">
                            <div class="catalog-card-top">
                                <div class="catalog-card-icon">
                                    <img src="images/CatalogA.png" alt="">
                                </div>
                                <div>
                                    <div class="catalog-label">Science</div>
                                    <h3>Biology Notes</h3>
                                </div>
                            </div>
                            <p>Biology concepts and study materials.</p>
                            <a href="#" class="spa-black-button" onclick="event.preventDefault();">View Notes</a>
                        </article>

                        <article class="catalog-card" data-catalog="chemistry science">
                            <div class="catalog-card-top">
                                <div class="catalog-card-icon">
                                    <img src="images/CatalogA.png" alt="">
                                </div>
                                <div>
                                    <div class="catalog-label">Science</div>
                                    <h3>Chemistry Notes</h3>
                                </div>
                            </div>
                            <p>Chemistry formulas and concepts.</p>
                            <a href="#" class="spa-black-button" onclick="event.preventDefault();">View Notes</a>
                        </article>
                    </div>
                </section>
            </div>
        `,

        calendar: `
            <div class="tuklass-route route-calendar">
                <div class="route-head">
                    <div>
                        <div class="route-kicker">Schedule</div>
                        <h1>Calendar</h1>
                        <p>Classes, tests, and your personal events in one place.</p>
                    </div>
                    <div class="route-head-icon">
                        <img src="images/CalendarB.png" alt="">
                    </div>
                </div>

                <div id="updateIndicator" class="update-indicator">Updating...</div>
                <div id="registrationArea"></div>

                <div id="calendarContent">
                    <div id="statusCard" class="status-card approved">
                        <strong id="statusTitle">Class Schedule Access</strong>
                        <div id="statusText" class="status-text"></div>
                    </div>

                    <div class="calendar-layout">
                        <div class="calendar-card">
                            <div class="calendar-toolbar">
                                <strong id="monthTitle"></strong>

                                <div class="month-buttons">
                                    <button class="month-button" type="button" onclick="changeMonth(-1)" aria-label="Previous month">‹</button>
                                    <button class="month-button today-button" type="button" onclick="goToToday()">Today</button>
                                    <button class="month-button" type="button" onclick="changeMonth(1)" aria-label="Next month">›</button>
                                </div>
                            </div>

                            <div class="weekdays">
                                <div class="weekday">Sun</div>
                                <div class="weekday">Mon</div>
                                <div class="weekday">Tue</div>
                                <div class="weekday">Wed</div>
                                <div class="weekday">Thu</div>
                                <div class="weekday">Fri</div>
                                <div class="weekday">Sat</div>
                            </div>

                            <div id="calendarGrid" class="calendar-grid"></div>
                        </div>

                        <aside class="side-card">
                            <h2>Upcoming</h2>
                            <div id="upcomingEvents"></div>

                            <div class="add-event">
                                <h3>Add Personal Event</h3>
                                <input id="eventTitle" class="event-input" type="text" placeholder="Event title">
                                <input id="eventDate" class="event-input" type="date">

                                <div class="event-row">
                                    <input id="eventStart" class="event-input" type="time">
                                    <input id="eventEnd" class="event-input" type="time">
                                </div>

                                <textarea id="eventDescription" class="event-textarea" placeholder="Description"></textarea>

                                <button id="addEventButton" class="spa-black-button route-full-button" type="button" onclick="addEvent()">
                                    Add Event
                                </button>

                                <div id="eventMessage" class="form-message"></div>
                            </div>
                        </aside>
                    </div>
                </div>

                <div id="lockScreen" class="route-lock" style="display:none;">
                    <div class="route-lock-card">
                        <div class="route-head-icon">
                            <img src="images/CalendarB.png" alt="">
                        </div>
                        <h2>Calendar unavailable</h2>
                        <p id="lockMessage">Your Tuklass access has expired.</p>
                        <a href="index.html" class="spa-black-button" data-spa-route="home">Back to Dashboard</a>
                    </div>
                </div>
            </div>
        `,

        reminders: `
            <div class="tuklass-route route-reminders">
                <div class="route-head">
                    <div>
                        <div class="route-kicker">Stay on track</div>
                        <h1>Reminders</h1>
                        <p>Class reminders and your personal reminders in one place.</p>
                    </div>
                    <div class="route-head-icon">
                        <img src="images/BelleB.png" alt="">
                    </div>
                </div>

                <div id="content">
                    <div class="route-loading-card">
                        <div class="route-spinner"></div>
                        <span>Loading reminders...</span>
                    </div>
                </div>
            </div>
        `,

        messages: `
            <div class="tuklass-route route-messages">
                <div class="route-head">
                    <div>
                        <div class="route-kicker">Conversations</div>
                        <div class="messages-title-row">
                            <h1>Messages</h1>
                            <div id="unreadTotal" class="unread-total hidden"></div>
                        </div>
                        <p>Talk with classmates and stay connected.</p>
                    </div>
                    <div class="route-head-icon">
                        <img src="images/MessageB.png" alt="">
                    </div>
                </div>

                <div id="conversationList" class="conversation-list">
                    <div class="route-loading-card">
                        <div class="route-spinner"></div>
                        <span>Loading conversations...</span>
                    </div>
                </div>
            </div>
        `
    };

    function displayName(name) {
        const clean = String(name || "").trim();
        const normalized = clean.replace(/\s+/g, " ").toLowerCase();

        if (
            normalized === "rick aldrei velilla" ||
            normalized === "rick aldrei a. velilla" ||
            normalized === "rick aldrei a velilla"
        ) {
            return "Rick Velilla";
        }

        return clean;
    }

    function routeFromPath(pathname) {
        const file = String(pathname || "")
            .split("/")
            .pop()
            .toLowerCase();

        if (!file || file === "index.html") return "home";
        if (file === "catalog.html") return "catalog";
        if (file === "calendar.html") return "calendar";
        if (file === "reminders.html") return "reminders";
        if (file === "messages.html") return "messages";

        return null;
    }

    function routeFromHref(href) {
        if (!href) return null;

        try {
            const url = new URL(href, window.location.href);
            if (url.origin !== window.location.origin) return null;
            return routeFromPath(url.pathname);
        } catch {
            return null;
        }
    }

    function getMain() {
        return document.querySelector("#dashboard .dashboard-main");
    }

    function getSavedUser() {
        try {
            const raw = localStorage.getItem("writejotUser");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function syncShell(user) {
        if (!user) return;

        const picture =
            user.profilePicture ||
            user.picture ||
            "images/Logo3.1.png";

        const sidebarPicture =
            document.getElementById("sidebarProfilePicture");

        const sidebarName =
            document.getElementById("sidebarProfileName");

        const sidebarUsername =
            document.getElementById("sidebarProfileUsername");

        if (sidebarPicture) {
            sidebarPicture.src = picture;
            sidebarPicture.onerror = function () {
                this.src = "images/Logo3.1.png";
            };
        }

        if (sidebarName) {
            sidebarName.textContent =
                displayName(user.name) ||
                user.email ||
                "Student";
        }

        if (sidebarUsername) {
            sidebarUsername.textContent =
                "@" + (user.username || "username");
        }

        const shortcut =
            document.querySelector(".profile-shortcut, .sidebar-edit");

        if (shortcut && user.username) {
            shortcut.href =
                "profile.html?username=" +
                encodeURIComponent(user.username);
        }
    }

    function updateActiveNav(route) {
        document
            .querySelectorAll("#dashboard .sidebar-link")
            .forEach(function (link) {
                const page = String(link.dataset.page || "");
                link.classList.toggle("active", page === route);
            });
    }

    function cleanupRoute(route) {
        try {
            if (route === "calendar" && window.TuklassCalendar) {
                window.TuklassCalendar.cleanup();
            }

            if (route === "reminders" && window.TuklassReminders) {
                window.TuklassReminders.cleanup();
            }

            if (route === "messages" && window.TuklassMessages) {
                window.TuklassMessages.cleanup();
            }
        } catch (error) {
            console.log("Route cleanup skipped.", error);
        }
    }

    function initCatalog() {
        const input = document.getElementById("spaCatalogSearch");
        if (!input) return;

        input.addEventListener("input", function () {
            const query = input.value.trim().toLowerCase();
            let visible = 0;

            document.querySelectorAll(".catalog-card").forEach(function (card) {
                const haystack =
                    (card.dataset.catalog || "") +
                    " " +
                    card.textContent;

                const match =
                    haystack.toLowerCase().includes(query);

                card.style.display = match ? "flex" : "none";
                if (match) visible++;
            });

            document.querySelectorAll(".catalog-subject").forEach(function (section) {
                const anyVisible =
                    Array.from(section.querySelectorAll(".catalog-card"))
                        .some(function (card) {
                            return card.style.display !== "none";
                        });

                section.style.display = anyVisible ? "block" : "none";
            });

            const empty = document.getElementById("spaCatalogNoResults");
            if (empty) empty.hidden = visible !== 0;
        });
    }

    async function initRoute(route) {
        if (route === "catalog") {
            initCatalog();
            return;
        }

        if (route === "calendar" && window.TuklassCalendar) {
            await window.TuklassCalendar.init();
            return;
        }

        if (route === "reminders" && window.TuklassReminders) {
            window.TuklassReminders.init();
            return;
        }

        if (route === "messages" && window.TuklassMessages) {
            await window.TuklassMessages.init();
        }
    }

    function renderHome(main) {
        main.innerHTML = homeMarkup;
        currentRoute = "home";
        updateActiveNav("home");

        const user = getSavedUser();
        if (user && originalShowDashboard) {
            originalShowDashboard(user);
        }

        syncShell(user);
    }

    async function renderRoute(route, options) {
        options = options || {};

        const main = getMain();
        if (!main || !route) return;

        if (route === currentRoute && !options.force) {
            updateActiveNav(route);
            document.documentElement.classList.remove("tuklass-route-boot");
            return;
        }

        cleanupRoute(currentRoute);

        const swap = function () {
            if (route === "home") {
                renderHome(main);
                return;
            }

            main.innerHTML = ROUTE_TEMPLATES[route];
            currentRoute = route;
            updateActiveNav(route);
            syncShell(getSavedUser());
        };

        if (document.startViewTransition && !options.noTransition) {
            const transition = document.startViewTransition(swap);
            try {
                await transition.updateCallbackDone;
            } catch {}
        } else {
            swap();
        }

        document.documentElement.classList.remove("tuklass-route-boot");

        if (ROUTE_TITLES[route]) {
            document.title = ROUTE_TITLES[route];
        }

        if (!options.skipHistory) {
            history.pushState(
                { tuklassRoute: route },
                "",
                ROUTE_URLS[route]
            );
        }

        await initRoute(route);
    }

    async function navigate(route, url) {
        if (!route || navigating) return;

        navigating = true;

        document.body.classList.add("tuklass-is-navigating");

        try {
            await renderRoute(route, {
                skipHistory: false
            });
        } finally {
            document.body.classList.remove("tuklass-is-navigating");
            navigating = false;
        }
    }

    function bindNavigation() {
        document.addEventListener(
            "click",
            function (event) {
                if (
                    event.defaultPrevented ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                ) {
                    return;
                }

                const link = event.target.closest("a");
                if (!link) return;

                if (
                    link.target === "_blank" ||
                    link.hasAttribute("download")
                ) {
                    return;
                }

                const href = link.getAttribute("href");
                if (!href || href.startsWith("#")) return;

                const route = routeFromHref(href);
                if (!route) return;

                event.preventDefault();
                navigate(route, href);
            },
            true
        );

        window.addEventListener("popstate", function () {
            const route = routeFromPath(location.pathname) || "home";

            renderRoute(route, {
                skipHistory: true,
                force: true
            });
        });
    }

    function patchDashboardRefresh() {
        originalShowDashboard =
            typeof window.showDashboard === "function"
                ? window.showDashboard
                : null;

        if (!originalShowDashboard) return;

        window.showDashboard = function (user) {
            if (!started || currentRoute === "home") {
                return originalShowDashboard(user);
            }

            /*
             * While another route is open, background account
             * refreshes should update the persistent shell only.
             * They must not recreate/overwrite the Home dashboard.
             */
            syncShell(user);
        };
    }

    function init() {
        const user = getSavedUser();

        /*
         * The public logged-out landing page remains untouched.
         */
        if (!user) {
            document.documentElement.classList.remove("tuklass-route-boot");
            return;
        }

        const main = getMain();
        if (!main) {
            document.documentElement.classList.remove("tuklass-route-boot");
            return;
        }

        homeMarkup = main.innerHTML;

        /*
         * Initial showDashboard() from the original index code has
         * already run because its DOMContentLoaded listener was
         * registered first. Patch only future background refreshes.
         */
        patchDashboardRefresh();
        bindNavigation();

        started = true;

        const initialRoute =
            routeFromPath(location.pathname) || "home";

        currentRoute = "home";

        if (initialRoute === "home") {
            updateActiveNav("home");
            syncShell(user);
            document.title = ROUTE_TITLES.home;
            document.documentElement.classList.remove("tuklass-route-boot");
        } else {
            renderRoute(initialRoute, {
                skipHistory: true,
                force: true,
                noTransition: true
            });
        }
    }

    window.TuklassSPA = {
        init,
        navigate,
        displayName,
        get route() {
            return currentRoute;
        }
    };

    document.addEventListener("DOMContentLoaded", init);
})();
