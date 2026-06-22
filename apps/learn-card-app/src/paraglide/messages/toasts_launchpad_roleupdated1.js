/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Launchpad_Roleupdated1Inputs */

const en_toasts_launchpad_roleupdated1 = /** @type {(inputs: Toasts_Launchpad_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Role updated`)
};

const es_toasts_launchpad_roleupdated1 = /** @type {(inputs: Toasts_Launchpad_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rol actualizado`)
};

const fr_toasts_launchpad_roleupdated1 = /** @type {(inputs: Toasts_Launchpad_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rôle mis à jour`)
};

const ar_toasts_launchpad_roleupdated1 = /** @type {(inputs: Toasts_Launchpad_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث الدور`)
};

/**
* | output |
* | --- |
* | "Role updated" |
*
* @param {Toasts_Launchpad_Roleupdated1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_launchpad_roleupdated1 = /** @type {((inputs?: Toasts_Launchpad_Roleupdated1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Launchpad_Roleupdated1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_launchpad_roleupdated1(inputs)
	if (locale === "es") return es_toasts_launchpad_roleupdated1(inputs)
	if (locale === "fr") return fr_toasts_launchpad_roleupdated1(inputs)
	return ar_toasts_launchpad_roleupdated1(inputs)
});
export { toasts_launchpad_roleupdated1 as "toasts.launchpad.roleUpdated" }