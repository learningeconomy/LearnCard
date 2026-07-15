/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Pushdescription1Inputs */

const en_notifications_pushdescription1 = /** @type {(inputs: Notifications_Pushdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New connection requests, New boosts (like achievements, credentials, and badges).`)
};

const es_notifications_pushdescription1 = /** @type {(inputs: Notifications_Pushdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevas solicitudes de conexión, nuevos Boosts (logros, credenciales e insignias).`)
};

const fr_notifications_pushdescription1 = /** @type {(inputs: Notifications_Pushdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelles demandes de connexion, nouveaux Boosts (comme les réalisations, justificatifs et badges).`)
};

const ar_notifications_pushdescription1 = /** @type {(inputs: Notifications_Pushdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New connection requests, New boosts (like achievements, credentials, and badges).`)
};

/**
* | output |
* | --- |
* | "New connection requests, New boosts (like achievements, credentials, and badges)." |
*
* @param {Notifications_Pushdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_pushdescription1 = /** @type {((inputs?: Notifications_Pushdescription1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Pushdescription1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_pushdescription1(inputs)
	if (locale === "es") return es_notifications_pushdescription1(inputs)
	if (locale === "fr") return fr_notifications_pushdescription1(inputs)
	return ar_notifications_pushdescription1(inputs)
});
export { notifications_pushdescription1 as "notifications.pushDescription" }