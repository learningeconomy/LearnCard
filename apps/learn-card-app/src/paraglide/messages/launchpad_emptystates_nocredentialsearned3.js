/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Nocredentialsearned3Inputs */

const en_launchpad_emptystates_nocredentialsearned3 = /** @type {(inputs: Launchpad_Emptystates_Nocredentialsearned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No credentials earned yet`)
};

const es_launchpad_emptystates_nocredentialsearned3 = /** @type {(inputs: Launchpad_Emptystates_Nocredentialsearned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no has obtenido credenciales`)
};

const fr_launchpad_emptystates_nocredentialsearned3 = /** @type {(inputs: Launchpad_Emptystates_Nocredentialsearned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun justificatif obtenu pour l'instant`)
};

const ar_launchpad_emptystates_nocredentialsearned3 = /** @type {(inputs: Launchpad_Emptystates_Nocredentialsearned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد بيانات اعتماد مكتسبة بعد`)
};

/**
* | output |
* | --- |
* | "No credentials earned yet" |
*
* @param {Launchpad_Emptystates_Nocredentialsearned3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_nocredentialsearned3 = /** @type {((inputs?: Launchpad_Emptystates_Nocredentialsearned3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Nocredentialsearned3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_nocredentialsearned3(inputs)
	if (locale === "es") return es_launchpad_emptystates_nocredentialsearned3(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_nocredentialsearned3(inputs)
	return ar_launchpad_emptystates_nocredentialsearned3(inputs)
});
export { launchpad_emptystates_nocredentialsearned3 as "launchpad.emptyStates.noCredentialsEarned" }