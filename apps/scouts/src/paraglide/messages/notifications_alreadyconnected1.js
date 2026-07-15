/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Alreadyconnected1Inputs */

const en_notifications_alreadyconnected1 = /** @type {(inputs: Notifications_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You are already connected.`)
};

const es_notifications_alreadyconnected1 = /** @type {(inputs: Notifications_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ya estás conectado.`)
};

const fr_notifications_alreadyconnected1 = /** @type {(inputs: Notifications_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes déjà connecté.`)
};

const ar_notifications_alreadyconnected1 = /** @type {(inputs: Notifications_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You are already connected.`)
};

/**
* | output |
* | --- |
* | "You are already connected." |
*
* @param {Notifications_Alreadyconnected1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_alreadyconnected1 = /** @type {((inputs?: Notifications_Alreadyconnected1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Alreadyconnected1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_alreadyconnected1(inputs)
	if (locale === "es") return es_notifications_alreadyconnected1(inputs)
	if (locale === "fr") return fr_notifications_alreadyconnected1(inputs)
	return ar_notifications_alreadyconnected1(inputs)
});
export { notifications_alreadyconnected1 as "notifications.alreadyConnected" }