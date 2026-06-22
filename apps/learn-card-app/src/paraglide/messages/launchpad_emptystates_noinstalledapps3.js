/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Noinstalledapps3Inputs */

const en_launchpad_emptystates_noinstalledapps3 = /** @type {(inputs: Launchpad_Emptystates_Noinstalledapps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your apps will live here`)
};

const es_launchpad_emptystates_noinstalledapps3 = /** @type {(inputs: Launchpad_Emptystates_Noinstalledapps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus aplicaciones aparecerán aquí`)
};

const fr_launchpad_emptystates_noinstalledapps3 = /** @type {(inputs: Launchpad_Emptystates_Noinstalledapps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos applications apparaîtront ici`)
};

const ar_launchpad_emptystates_noinstalledapps3 = /** @type {(inputs: Launchpad_Emptystates_Noinstalledapps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستظهر تطبيقاتك هنا`)
};

/**
* | output |
* | --- |
* | "Your apps will live here" |
*
* @param {Launchpad_Emptystates_Noinstalledapps3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_noinstalledapps3 = /** @type {((inputs?: Launchpad_Emptystates_Noinstalledapps3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Noinstalledapps3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_noinstalledapps3(inputs)
	if (locale === "es") return es_launchpad_emptystates_noinstalledapps3(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_noinstalledapps3(inputs)
	return ar_launchpad_emptystates_noinstalledapps3(inputs)
});
export { launchpad_emptystates_noinstalledapps3 as "launchpad.emptyStates.noInstalledApps" }