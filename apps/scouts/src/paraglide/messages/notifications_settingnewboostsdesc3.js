/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Settingnewboostsdesc3Inputs */

const en_notifications_settingnewboostsdesc3 = /** @type {(inputs: Notifications_Settingnewboostsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts include all types of credentials including:  Skills, IDs, Achievements, Learning History, Work History, Currency, and Badges.`)
};

const es_notifications_settingnewboostsdesc3 = /** @type {(inputs: Notifications_Settingnewboostsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los Boosts incluyen todo tipo de credenciales: Habilidades, IDs, Logros, Historial de Aprendizaje, etc.`)
};

const fr_notifications_settingnewboostsdesc3 = /** @type {(inputs: Notifications_Settingnewboostsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les Boosts incluent tous les types de justificatifs : compétences, identifiants, réalisations, historique d'apprentissage, historique professionnel, devises et badges.`)
};

const ar_notifications_settingnewboostsdesc3 = /** @type {(inputs: Notifications_Settingnewboostsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts include all types of credentials including:  Skills, IDs, Achievements, Learning History, Work History, Currency, and Badges.`)
};

/**
* | output |
* | --- |
* | "Boosts include all types of credentials including: Skills, IDs, Achievements, Learning History, Work History, Currency, and Badges." |
*
* @param {Notifications_Settingnewboostsdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_settingnewboostsdesc3 = /** @type {((inputs?: Notifications_Settingnewboostsdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Settingnewboostsdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_settingnewboostsdesc3(inputs)
	if (locale === "es") return es_notifications_settingnewboostsdesc3(inputs)
	if (locale === "fr") return fr_notifications_settingnewboostsdesc3(inputs)
	return ar_notifications_settingnewboostsdesc3(inputs)
});
export { notifications_settingnewboostsdesc3 as "notifications.settingNewBoostsDesc" }