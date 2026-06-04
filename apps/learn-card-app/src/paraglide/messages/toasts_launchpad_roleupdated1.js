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

const de_toasts_launchpad_roleupdated1 = /** @type {(inputs: Toasts_Launchpad_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rolle aktualisiert`)
};

const ar_toasts_launchpad_roleupdated1 = /** @type {(inputs: Toasts_Launchpad_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث الدور`)
};

const fr_toasts_launchpad_roleupdated1 = /** @type {(inputs: Toasts_Launchpad_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rôle mis à jour`)
};

const ko_toasts_launchpad_roleupdated1 = /** @type {(inputs: Toasts_Launchpad_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`역할 업데이트됨`)
};

/**
* | output |
* | --- |
* | "Role updated" |
*
* @param {Toasts_Launchpad_Roleupdated1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_launchpad_roleupdated1 = /** @type {((inputs?: Toasts_Launchpad_Roleupdated1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Launchpad_Roleupdated1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_launchpad_roleupdated1(inputs)
	if (locale === "es") return es_toasts_launchpad_roleupdated1(inputs)
	if (locale === "de") return de_toasts_launchpad_roleupdated1(inputs)
	if (locale === "ar") return ar_toasts_launchpad_roleupdated1(inputs)
	if (locale === "fr") return fr_toasts_launchpad_roleupdated1(inputs)
	return ko_toasts_launchpad_roleupdated1(inputs)
});
export { toasts_launchpad_roleupdated1 as "toasts.launchpad.roleUpdated" }