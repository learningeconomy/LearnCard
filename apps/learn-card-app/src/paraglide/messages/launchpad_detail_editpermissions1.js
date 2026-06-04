/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Editpermissions1Inputs */

const en_launchpad_detail_editpermissions1 = /** @type {(inputs: Launchpad_Detail_Editpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Permissions`)
};

const es_launchpad_detail_editpermissions1 = /** @type {(inputs: Launchpad_Detail_Editpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar permisos`)
};

const de_launchpad_detail_editpermissions1 = /** @type {(inputs: Launchpad_Detail_Editpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigungen bearbeiten`)
};

const ar_launchpad_detail_editpermissions1 = /** @type {(inputs: Launchpad_Detail_Editpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الأذونات`)
};

const fr_launchpad_detail_editpermissions1 = /** @type {(inputs: Launchpad_Detail_Editpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier les autorisations`)
};

const ko_launchpad_detail_editpermissions1 = /** @type {(inputs: Launchpad_Detail_Editpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`권한 편집`)
};

/**
* | output |
* | --- |
* | "Edit Permissions" |
*
* @param {Launchpad_Detail_Editpermissions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_editpermissions1 = /** @type {((inputs?: Launchpad_Detail_Editpermissions1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Editpermissions1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_editpermissions1(inputs)
	if (locale === "es") return es_launchpad_detail_editpermissions1(inputs)
	if (locale === "de") return de_launchpad_detail_editpermissions1(inputs)
	if (locale === "ar") return ar_launchpad_detail_editpermissions1(inputs)
	if (locale === "fr") return fr_launchpad_detail_editpermissions1(inputs)
	return ko_launchpad_detail_editpermissions1(inputs)
});
export { launchpad_detail_editpermissions1 as "launchpad.detail.editPermissions" }