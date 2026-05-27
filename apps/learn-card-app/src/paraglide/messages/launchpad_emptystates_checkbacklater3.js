/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Checkbacklater3Inputs */

const en_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check back later — new apps are added all the time.`)
};

const es_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vuelve más tarde — se añaden apps nuevas con frecuencia.`)
};

const de_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schau später nochmal vorbei — neue Apps werden ständig hinzugefügt.`)
};

const ar_launchpad_emptystates_checkbacklater3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacklater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عد لاحقاً — تتم إضافة تطبيقات جديدة بانتظام.`)
};

/**
* | output |
* | --- |
* | "Check back later — new apps are added all the time." |
*
* @param {Launchpad_Emptystates_Checkbacklater3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_checkbacklater3 = /** @type {((inputs?: Launchpad_Emptystates_Checkbacklater3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Checkbacklater3Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_checkbacklater3(inputs)
	if (locale === "es") return es_launchpad_emptystates_checkbacklater3(inputs)
	if (locale === "de") return de_launchpad_emptystates_checkbacklater3(inputs)
	return ar_launchpad_emptystates_checkbacklater3(inputs)
});
export { launchpad_emptystates_checkbacklater3 as "launchpad.emptyStates.checkBackLater" }