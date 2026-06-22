/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Modal_Roleupdated1Inputs */

const en_launchpad_modal_roleupdated1 = /** @type {(inputs: Launchpad_Modal_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Role updated`)
};

const es_launchpad_modal_roleupdated1 = /** @type {(inputs: Launchpad_Modal_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rol actualizado`)
};

const fr_launchpad_modal_roleupdated1 = /** @type {(inputs: Launchpad_Modal_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rôle mis à jour`)
};

const ar_launchpad_modal_roleupdated1 = /** @type {(inputs: Launchpad_Modal_Roleupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث الدور`)
};

/**
* | output |
* | --- |
* | "Role updated" |
*
* @param {Launchpad_Modal_Roleupdated1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_modal_roleupdated1 = /** @type {((inputs?: Launchpad_Modal_Roleupdated1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Modal_Roleupdated1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_modal_roleupdated1(inputs)
	if (locale === "es") return es_launchpad_modal_roleupdated1(inputs)
	if (locale === "fr") return fr_launchpad_modal_roleupdated1(inputs)
	return ar_launchpad_modal_roleupdated1(inputs)
});
export { launchpad_modal_roleupdated1 as "launchpad.modal.roleUpdated" }