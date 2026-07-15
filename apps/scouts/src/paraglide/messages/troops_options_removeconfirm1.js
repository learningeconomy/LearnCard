/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Options_Removeconfirm1Inputs */

const en_troops_options_removeconfirm1 = /** @type {(inputs: Troops_Options_Removeconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to remove {owner} from {credential}?`)
};

const es_troops_options_removeconfirm1 = /** @type {(inputs: Troops_Options_Removeconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres eliminar a {owner} de {credential}?`)
};

const fr_troops_options_removeconfirm1 = /** @type {(inputs: Troops_Options_Removeconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir retirer {owner} de {credential} ?`)
};

const ar_troops_options_removeconfirm1 = /** @type {(inputs: Troops_Options_Removeconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد من إزالة {owner} من {credential}؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to remove {owner} from {credential}?" |
*
* @param {Troops_Options_Removeconfirm1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_options_removeconfirm1 = /** @type {((inputs?: Troops_Options_Removeconfirm1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Options_Removeconfirm1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_options_removeconfirm1(inputs)
	if (locale === "es") return es_troops_options_removeconfirm1(inputs)
	if (locale === "fr") return fr_troops_options_removeconfirm1(inputs)
	return ar_troops_options_removeconfirm1(inputs)
});
export { troops_options_removeconfirm1 as "troops.options.removeConfirm" }