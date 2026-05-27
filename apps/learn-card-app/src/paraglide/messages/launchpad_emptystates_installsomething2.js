/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Installsomething2Inputs */

const en_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install something from the App Store to get started.`)
};

const es_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instala algo desde la App Store para empezar.`)
};

const de_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installiere etwas aus dem App Store, um loszulegen.`)
};

const ar_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ثبّت شيئاً من متجر التطبيقات للبدء.`)
};

/**
* | output |
* | --- |
* | "Install something from the App Store to get started." |
*
* @param {Launchpad_Emptystates_Installsomething2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_installsomething2 = /** @type {((inputs?: Launchpad_Emptystates_Installsomething2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Installsomething2Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_installsomething2(inputs)
	if (locale === "es") return es_launchpad_emptystates_installsomething2(inputs)
	if (locale === "de") return de_launchpad_emptystates_installsomething2(inputs)
	return ar_launchpad_emptystates_installsomething2(inputs)
});
export { launchpad_emptystates_installsomething2 as "launchpad.emptyStates.installSomething" }