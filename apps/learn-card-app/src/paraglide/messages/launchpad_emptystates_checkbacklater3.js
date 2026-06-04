/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Checkbacklater3Inputs */

const en_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check back later — new apps are added all the time.`)
};

const es_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vuelve pronto — se agregan nuevas aplicaciones todo el tiempo.`)
};

const de_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schau später vorbei — es werden ständig neue Apps hinzugefügt.`)
};

const ar_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق لاحقاً — تُضاف تطبيقات جديدة باستمرار.`)
};

const fr_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revenez plus tard — de nouvelles applications sont ajoutées régulièrement.`)
};

const ko_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`나중에 다시 확인하세요 — 새로운 앱이 계속 추가됩니다.`)
};

/**
* | output |
* | --- |
* | "Check back later — new apps are added all the time." |
*
* @param {Launchpad_Emptystates_Checkbacklater3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_checkbacklater3 = /** @type {((inputs?: Launchpad_Emptystates_Checkbacklater3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Checkbacklater3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_checkbacklater3(inputs)
	if (locale === "es") return es_launchpad_emptystates_checkbacklater3(inputs)
	if (locale === "de") return de_launchpad_emptystates_checkbacklater3(inputs)
	if (locale === "ar") return ar_launchpad_emptystates_checkbacklater3(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_checkbacklater3(inputs)
	return ko_launchpad_emptystates_checkbacklater3(inputs)
});
export { launchpad_emptystates_checkbacklater3 as "launchpad.emptyStates.checkBackLater" }