/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Installsomething2Inputs */

const en_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install something from the App Store to get started.`)
};

const es_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instala algo desde la Tienda de aplicaciones para comenzar.`)
};

const de_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installiere etwas aus dem App Store, um loszulegen.`)
};

const ar_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتثبيت تطبيق من المتجر للبدء.`)
};

const fr_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installez une application depuis la boutique pour commencer.`)
};

const ko_launchpad_emptystates_installsomething2 = /** @type {(inputs: Launchpad_Emptystates_Installsomething2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`앱 스토어에서 설치하여 시작하세요.`)
};

/**
* | output |
* | --- |
* | "Install something from the App Store to get started." |
*
* @param {Launchpad_Emptystates_Installsomething2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_installsomething2 = /** @type {((inputs?: Launchpad_Emptystates_Installsomething2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Installsomething2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_installsomething2(inputs)
	if (locale === "es") return es_launchpad_emptystates_installsomething2(inputs)
	if (locale === "de") return de_launchpad_emptystates_installsomething2(inputs)
	if (locale === "ar") return ar_launchpad_emptystates_installsomething2(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_installsomething2(inputs)
	return ko_launchpad_emptystates_installsomething2(inputs)
});
export { launchpad_emptystates_installsomething2 as "launchpad.emptyStates.installSomething" }