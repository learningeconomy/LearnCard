/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Aidisabledminor2Inputs */

const en_launchpad_aidisabledminor2 = /** @type {(inputs: Launchpad_Aidisabledminor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI features are not available for users under 18.`)
};

const es_launchpad_aidisabledminor2 = /** @type {(inputs: Launchpad_Aidisabledminor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las funciones de IA no están disponibles para usuarios menores de 18 años.`)
};

const de_launchpad_aidisabledminor2 = /** @type {(inputs: Launchpad_Aidisabledminor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`KI-Funktionen sind für Nutzer unter 18 nicht verfügbar.`)
};

const ar_launchpad_aidisabledminor2 = /** @type {(inputs: Launchpad_Aidisabledminor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ميزات الذكاء الاصطناعي غير متاحة للمستخدمين دون سن 18.`)
};

/**
* | output |
* | --- |
* | "AI features are not available for users under 18." |
*
* @param {Launchpad_Aidisabledminor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_aidisabledminor2 = /** @type {((inputs?: Launchpad_Aidisabledminor2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Aidisabledminor2Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_aidisabledminor2(inputs)
	if (locale === "es") return es_launchpad_aidisabledminor2(inputs)
	if (locale === "de") return de_launchpad_aidisabledminor2(inputs)
	return ar_launchpad_aidisabledminor2(inputs)
});
export { launchpad_aidisabledminor2 as "launchpad.aiDisabledMinor" }