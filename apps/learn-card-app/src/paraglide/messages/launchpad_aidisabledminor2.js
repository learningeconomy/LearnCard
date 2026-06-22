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

const fr_launchpad_aidisabledminor2 = /** @type {(inputs: Launchpad_Aidisabledminor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les fonctionnalités IA ne sont pas disponibles pour les utilisateurs de moins de 18 ans.`)
};

const ar_launchpad_aidisabledminor2 = /** @type {(inputs: Launchpad_Aidisabledminor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ميزات الذكاء الاصطناعي غير متاحة للمستخدمين دون 18 عاماً.`)
};

/**
* | output |
* | --- |
* | "AI features are not available for users under 18." |
*
* @param {Launchpad_Aidisabledminor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_aidisabledminor2 = /** @type {((inputs?: Launchpad_Aidisabledminor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Aidisabledminor2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_aidisabledminor2(inputs)
	if (locale === "es") return es_launchpad_aidisabledminor2(inputs)
	if (locale === "fr") return fr_launchpad_aidisabledminor2(inputs)
	return ar_launchpad_aidisabledminor2(inputs)
});
export { launchpad_aidisabledminor2 as "launchpad.aiDisabledMinor" }