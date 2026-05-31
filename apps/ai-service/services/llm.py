"""Concierge response engine for Kodai International.

Rule-based for now — see CLAUDE INTEGRATION STUB below when the Anthropic key is ready.
All facts verified from kodaiinternational.com (May 2026).
"""

from __future__ import annotations

import re

# ─── HOTEL KNOWLEDGE BASE ────────────────────────────────────────────────────

HKI = {
    "name": "Kodai International",
    "tagline": "The Largest Resort in Kodaikanal",
    "owner": "ESTEJI Hotels Private Ltd",
    "address": "17/328 Lawsghat Road, Kodaikanal – 624 101, Tamil Nadu",
    "phone_mobile": "+91 9944945190",
    "phone_landline": "+91 4542 245190",
    "email_reservations": "reservations@hki.co.in",
    "email_sales": "sales@hki.co.in",
    "website": "kodaiinternational.com",
    "checkin": "2:00 PM",
    "checkout": "11:00 AM",
}

ROOMS: dict[str, dict] = {
    "executive": {
        "name": "Executive Room", "price": 5000, "bed": "King bed",
        "view": "Garden view", "max_guests": 2,
        "highlights": ["High-speed WiFi", "AC & heater", "24-hr hot water", "Tea/coffee maker", "In-room safe"],
    },
    "deluxe": {
        "name": "Deluxe Double", "price": 6250, "bed": "King bed",
        "view": "Valley view with private balcony", "max_guests": 2,
        "highlights": ["Private balcony", "Valley view", "High-speed WiFi", "AC & heater", "In-room safe"],
    },
    "family": {
        "name": "Family Room", "price": 7150, "bed": "King + 2 singles",
        "view": "Garden / Lawn view", "max_guests": 4,
        "highlights": ["Sleeps 4", "King + 2 single beds", "Garden view", "AC & heater", "24-hr hot water"],
    },
    "jr_suite": {
        "name": "Jr. Suite", "price": 8300, "bed": "King bed",
        "view": "Hill view with sitting lounge", "max_guests": 2,
        "highlights": ["Sitting lounge", "Soaking bathtub", "Hill view", "AC & heater", "In-room safe"],
    },
    "suite": {
        "name": "Suite", "price": 10000, "bed": "King bed",
        "view": "Panoramic hill view", "max_guests": 2,
        "highlights": ["Jacuzzi", "Living & dining area", "Panoramic view", "Butler on request", "In-room safe"],
    },
}

# Sorted longest-key-first so multi-word items match before single-word ones
MENU: dict[str, dict] = {
    "masala chai":        {"price": 80,  "eta": 15, "note": "SMess style"},
    "filter coffee":      {"price": 160, "eta": 15, "note": "South Indian style"},
    "fresh lime soda":    {"price": 90,  "eta": 10, "note": ""},
    "south indian thali": {"price": 350, "eta": 35, "note": "SMess style, banana leaf"},
    "continental breakfast": {"price": 420, "eta": 30, "note": "Orchard Restaurant"},
    "veg fried rice":     {"price": 280, "eta": 25, "note": "Orchard Restaurant"},
    "grilled sandwich":   {"price": 220, "eta": 20, "note": "Grilled, with chutney"},
    "veg sandwich":       {"price": 220, "eta": 20, "note": "Grilled, with chutney"},
    "chocolate cake":     {"price": 250, "eta": 15, "note": "Homemade — 24hr Coffee Shop"},
    "house wine":         {"price": 480, "eta": 10, "note": "Glass — Oasis Bar"},
    "cappuccino":         {"price": 160, "eta": 15, "note": ""},
    "ice cream":          {"price": 180, "eta": 10, "note": "2 scoops — 24hr Coffee Shop"},
    "lemonade":           {"price": 90,  "eta": 10, "note": ""},
    "sandwich":           {"price": 220, "eta": 20, "note": "Grilled, with chutney"},
    "breakfast":          {"price": 420, "eta": 30, "note": "Continental — Orchard Restaurant"},
    "thali":              {"price": 350, "eta": 35, "note": "SMess style, banana leaf"},
    "dinner":             {"price": 350, "eta": 35, "note": "Orchard Restaurant — in-room service"},
    "lunch":              {"price": 350, "eta": 35, "note": "Orchard Restaurant — in-room service"},
    "coffee":             {"price": 160, "eta": 15, "note": "South Indian style"},
    "pasta":              {"price": 320, "eta": 25, "note": "Orchard Restaurant"},
    "beer":               {"price": 320, "eta": 10, "note": "Pint — Oasis Bar"},
    "wine":               {"price": 480, "eta": 10, "note": "House wine, glass — Oasis Bar"},
    "cake":               {"price": 250, "eta": 15, "note": "Homemade — 24hr Coffee Shop"},
    "snack":              {"price": 180, "eta": 20, "note": "HKI Tea Kadai"},
    "chai":               {"price": 80,  "eta": 15, "note": "SMess style"},
    "tea":                {"price": 80,  "eta": 15, "note": ""},
}

NEARBY: dict[str, tuple[str, str, str]] = {
    "kodaikanal lake": ("Kodaikanal Lake", "6 min drive", "star-shaped, 5 km shoreline"),
    "coakers walk":    ("Coaker's Walk", "10 min drive", "cliff promenade with valley views"),
    "coaker's walk":   ("Coaker's Walk", "10 min drive", "cliff promenade with valley views"),
    "coaker":          ("Coaker's Walk", "10 min drive", "cliff promenade with valley views"),
    "bryant park":     ("Bryant Park", "8 min drive", "botanical gardens"),
    "pillar rocks":    ("Pillar Rocks", "20 min drive", "122 m granite shafts"),
    "silver cascade":  ("Silver Cascade Falls", "12 min drive", "55 m waterfall"),
    "berijam":         ("Berijam Lake", "45 min drive", "forest permit required"),
    "kurinji":         ("Kurinji Andavar Temple", "15 min drive", ""),
    "bazaar":          ("Tibetan & Coronation Bazaar", "8 min drive", "woollens, chocolates"),
    "lake":            ("Kodaikanal Lake", "6 min drive", "star-shaped, 5 km shoreline"),
    "falls":           ("Silver Cascade Falls", "12 min drive", "55 m waterfall"),
    "market":          ("Tibetan & Coronation Bazaar", "8 min drive", "woollens, chocolates"),
}


# ─── INTENT DETECTION ────────────────────────────────────────────────────────

def _detect_intent(msg: str) -> str:
    m = msg.lower()
    if re.search(r"\b(order|bring|send|get me|i want|i'?d like|can i get|can i have|arrange.*food|food.*order)\b", m):
        return "ORDER"
    if re.search(r"\b(checkout|check.?out|late check|early check.?in)\b", m):
        return "POLICY"
    if re.search(r"\b(cab|taxi|car|drop|pickup|transport|airport|bus|drive|ride)\b", m):
        return "TRANSPORT"
    if re.search(r"\b(housekeeping|towels?|pillows?|blankets?|toiletries|clean|amenities|iron|laundry|toilet paper)\b", m):
        return "HOUSEKEEPING"
    if re.search(r"\b(restaurant|dining|breakfast|lunch|dinner|menu|food|eat|bar|oasis|smess|orchard|coffee shop|tea kadai|hours|open)\b", m):
        return "DINING_INFO"
    if re.search(r"\b(room|suite|executive|deluxe|family room|rate|upgrade|price.*room|room.*price)\b", m):
        return "ROOM_INFO"
    if re.search(r"\b(nearby|visit|attraction|lake|park|waterfall|temple|bazaar|shopping|coaker|pillar|berijam|falls|explore)\b", m):
        return "NEARBY"
    if re.search(r"\b(wifi|wi-fi|password|internet|network|connect)\b", m):
        return "WIFI"
    if re.search(r"\b(bonfire|fire|lawn|outdoor|night activity|evening|stargazing)\b", m):
        return "ACTIVITY"
    if re.search(r"\b(help|staff|manager|reception|front desk|speak|person|human|call|phone|contact)\b", m):
        return "ESCALATION"
    return "INQUIRY"


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def _guest_name(guest_profile: dict) -> str:
    return (
        guest_profile.get("first_name")
        or (guest_profile.get("full_name") or "").split()[0]
        or "there"
    )


def _find_menu_item(msg: str) -> tuple[str, dict] | tuple[None, None]:
    m = msg.lower()
    for key in sorted(MENU.keys(), key=len, reverse=True):
        if key in m:
            return key, MENU[key]
    return None, None


def _order_action(display_name: str, item: dict, qty: int = 1) -> dict:
    return {
        "type": "order_created",
        "items": [{"name": display_name.title(), "qty": qty, "price": item["price"], "sub": item["note"]}],
        "total": item["price"] * qty,
        "currency_symbol": "₹",
        "eta_minutes": item["eta"],
    }


def _service_action(service: str, notes: str) -> dict:
    return {"type": "service_requested", "service": service, "notes": notes}


# ─── RESPONSE BUILDERS ───────────────────────────────────────────────────────

def _respond_order(msg: str, gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    key, item = _find_menu_item(msg)
    if item is None:
        return (
            f"What would you like, {name}? I can arrange beverages, meals from Orchard Restaurant, "
            f"or anything from the 24-hour coffee shop.",
            [],
        )
    note_str = f" — {item['note']}" if item["note"] else ""
    text = (
        f"Coming right up, {name}. {key.title()}{note_str} will be with you in about {item['eta']} minutes. "
        f"₹{item['price']} will be added to your folio."
    )
    return text, [_order_action(key, item)]


def _respond_transport(msg: str, gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    m = msg.lower()
    dest = "your destination"
    for spot, (place, drive, _) in NEARBY.items():
        if spot in m:
            dest = f"{place} ({drive})"
            break
    if "airport" in m and "madurai" in m or "madurai" in m:
        dest = "Madurai Airport (approx. 3 hr drive)"
    elif "coimbatore" in m:
        dest = "Coimbatore Airport (approx. 3.5 hr drive)"
    elif "airport" in m:
        dest = "the airport"
    text = (
        f"I'll arrange a cab to {dest}, {name}. "
        f"Our driver will be at the lobby — reception will confirm the timing shortly. "
        f"You can also call {HKI['phone_mobile']} for immediate assistance."
    )
    return text, [_service_action("Transport", f"Cab requested to {dest}")]


def _respond_housekeeping(msg: str, gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    m = msg.lower()
    if "towel" in m:
        item = "Extra towels"
    elif "pillow" in m or "blanket" in m:
        item = "Extra pillows / blanket"
    elif "iron" in m or "laundry" in m:
        item = "Laundry / ironing service"
    elif "clean" in m or "housekeeping" in m:
        item = "Room cleaning"
    elif "toiletries" in m or "amenities" in m:
        item = "Toiletries replenishment"
    else:
        item = "Housekeeping request"
    text = f"I've sent a housekeeping request for {item.lower()}, {name}. Someone will be with you shortly."
    return text, [_service_action("Housekeeping", item)]


def _respond_policy(msg: str, gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    m = msg.lower()
    if "late" in m:
        text = (
            f"Late check-out is available until 2:00 PM subject to availability, {name}. "
            f"I'll flag the request — front desk will confirm. Standard check-out is {HKI['checkout']}."
        )
        return text, [_service_action("Late Check-out", "Guest requested late check-out")]
    if "early" in m:
        text = (
            f"Early check-in from 10:00 AM can sometimes be arranged based on availability, {name}. "
            f"Standard check-in is {HKI['checkin']}. I'll request it for you."
        )
        return text, [_service_action("Early Check-in", "Guest requested early check-in")]
    text = (
        f"Check-in at {HKI['name']} is from {HKI['checkin']} and check-out by {HKI['checkout']}, {name}. "
        f"Early check-in or late check-out can be arranged on request, subject to availability."
    )
    return text, []


def _respond_dining(msg: str, gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    m = msg.lower()
    if "oasis" in m or "bar" in m:
        text = (
            f"The Oasis Bar is open 5:00 PM – 11:00 PM, {name}. "
            f"Cocktails, fine wines, and small bites. A pint of beer is ₹320, house wine ₹480 a glass."
        )
    elif "smess" in m:
        text = (
            f"SMess is our South Indian feast on banana leaves — 25+ varieties, mud-pot firewood cooking, "
            f"staff in traditional attire. Lunch 12–3:30 PM, dinner 7–10 PM. ₹350 per head."
        )
    elif "coffee shop" in m or "24" in m:
        text = (
            f"The 24-hour Coffee Shop is always open, {name} — coffee, homemade baked goods, and ice cream "
            f"at any hour. Filter coffee is ₹160, chocolate cake ₹250."
        )
    elif "tea kadai" in m or "tea shop" in m:
        text = (
            f"HKI Tea Kadai is our outdoor tea shop, open 7 AM – 8 PM, {name}. "
            f"Hot beverages, snacks, and garden views. Masala chai is ₹80."
        )
    elif "breakfast" in m:
        text = (
            f"Breakfast is served at Orchard Restaurant from 7:00 AM, {name}. "
            f"Continental breakfast is ₹420. In-room service takes about 30 minutes — same menu."
        )
    else:
        text = (
            f"Dining at {HKI['name']}, {name}: Orchard Restaurant (multi-cuisine, 7 AM–10:30 PM), "
            f"SMess (South Indian feast, lunch & dinner), HKI Tea Kadai (outdoor, 7 AM–8 PM), "
            f"24hr Coffee Shop (always open), and Oasis Bar (cocktails, 5–11 PM). "
            f"Most can be delivered to your room."
        )
    return text, []


def _respond_room_info(msg: str, gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    m = msg.lower()
    room = None
    if "jr" in m and "suite" in m:
        room = ROOMS["jr_suite"]
    elif "suite" in m:
        room = ROOMS["suite"]
    elif "deluxe" in m:
        room = ROOMS["deluxe"]
    elif "family" in m:
        room = ROOMS["family"]
    elif "executive" in m:
        room = ROOMS["executive"]
    if room:
        text = (
            f"The {room['name']} starts from ₹{room['price']:,}/night, {name}. "
            f"{room['bed']}, {room['view']}, up to {room['max_guests']} guests. "
            f"Includes: {', '.join(room['highlights'][:3])}. "
            f"For bookings call {HKI['phone_mobile']} or email {HKI['email_reservations']}."
        )
    else:
        text = (
            f"We have 5 room types at {HKI['name']}, {name}: "
            f"Executive (₹5,000+), Deluxe Double with valley view & balcony (₹6,250+), "
            f"Family Room for up to 4 (₹7,150+), Jr. Suite with soaking bathtub (₹8,300+), "
            f"and Suite with jacuzzi & panoramic views (₹10,000+). "
            f"All include WiFi, AC, heater, and 24-hr hot water. Which interests you?"
        )
    return text, []


def _respond_nearby(msg: str, gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    m = msg.lower()
    for key, (place, drive, desc) in NEARBY.items():
        if key in m:
            desc_str = f" — {desc}" if desc else ""
            text = f"{place} is a {drive} from the hotel{desc_str}, {name}. Shall I arrange a cab?"
            return text, [_service_action("Transport", f"Cab enquiry to {place}")]
    text = (
        f"From {HKI['name']}, {name}: Kodaikanal Lake (6 min), Bryant Park (8 min), "
        f"Coaker's Walk (10 min), Silver Cascade Falls (12 min), Pillar Rocks (20 min), "
        f"Berijam Lake (45 min, forest permit needed). Shall I arrange a cab?"
    )
    return text, []


def _respond_wifi(gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    text = (
        f"High-speed WiFi is complimentary throughout the property, {name}. "
        f"The network name and password are in your welcome folder. "
        f"If you need them again, call reception at {HKI['phone_mobile']}."
    )
    return text, []


def _respond_activity(msg: str, gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    m = msg.lower()
    if "bonfire" in m or "fire" in m:
        text = (
            f"The bonfire on the lawn is lit every evening around 7:00 PM, weather permitting, {name}. "
            f"The Oasis Bar opens at 5 PM if you'd like a drink while the fire is set up. No reservation needed."
        )
        return text, [_service_action("Activity", "Bonfire — guest notified")]
    text = (
        f"This evening at {HKI['name']}, {name}: bonfire on the lawn (~7 PM), "
        f"Oasis Bar (5–11 PM), or a quiet walk through the garden. "
        f"The 24-hour coffee shop is always open."
    )
    return text, []


def _respond_escalation(gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    text = (
        f"I'll connect you with a team member now, {name}. "
        f"You can also reach reception directly at {HKI['phone_mobile']} — available 24 hours."
    )
    return text, [{"type": "human_escalation", "reason": "Guest requested human assistance"}]


def _respond_inquiry(gp: dict) -> tuple[str, list[dict]]:
    name = _guest_name(gp)
    text = (
        f"Happy to help, {name}. Ask me about dining, room service, nearby attractions, "
        f"transport, housekeeping, or hotel policies. "
        f"For anything urgent, reception is at {HKI['phone_mobile']} — round the clock."
    )
    return text, []


# ─── RULE-BASED ENGINE ───────────────────────────────────────────────────────

def _rule_based_response(
    user_message: str,
    conversation_history: list[dict],
    context_chunks: list[str],
    guest_profile: dict,
) -> tuple[str, list[dict]]:
    intent = _detect_intent(user_message)
    if intent == "ORDER":
        return _respond_order(user_message, guest_profile)
    if intent == "TRANSPORT":
        return _respond_transport(user_message, guest_profile)
    if intent == "HOUSEKEEPING":
        return _respond_housekeeping(user_message, guest_profile)
    if intent == "POLICY":
        return _respond_policy(user_message, guest_profile)
    if intent == "DINING_INFO":
        return _respond_dining(user_message, guest_profile)
    if intent == "ROOM_INFO":
        return _respond_room_info(user_message, guest_profile)
    if intent == "NEARBY":
        return _respond_nearby(user_message, guest_profile)
    if intent == "WIFI":
        return _respond_wifi(guest_profile)
    if intent == "ACTIVITY":
        return _respond_activity(user_message, guest_profile)
    if intent == "ESCALATION":
        return _respond_escalation(guest_profile)
    return _respond_inquiry(guest_profile)


# ─── CLAUDE INTEGRATION STUB ─────────────────────────────────────────────────
# Swap generate_response body for this when the Anthropic key is wired:
#
#   import anthropic
#   _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
#   response = _client.messages.create(
#       model=settings.claude_model,
#       max_tokens=512,
#       system=HKI_SYSTEM_PROMPT,   # paste the full prompt block here
#       messages=conversation_history + [{"role": "user", "content": user_message}],
#   )
#   return _split_actions(response.content[0].text)


# ─── PUBLIC API ──────────────────────────────────────────────────────────────

def generate_response(
    user_message: str,
    conversation_history: list[dict],
    context_chunks: list[str],
    guest_profile: dict,
    hotel_name: str,
) -> tuple[str, list[dict]]:
    return _rule_based_response(user_message, conversation_history, context_chunks, guest_profile)


def generate_brief(prompt: str) -> str:
    return (
        "Review the guest's conversation history and recent service requests. "
        "Prioritise any pending orders, transport bookings, or housekeeping items. "
        "AI-generated briefs will be available once the Claude API key is connected."
    )
