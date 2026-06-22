/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Deleteconfirm3Inputs */

const en_developerportal_components_partnerdashboard_deleteconfirm3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Deleteconfirm3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to delete this listing?`)
};

const es_developerportal_components_partnerdashboard_deleteconfirm3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Deleteconfirm3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que quieres eliminar este listado?`)
};

const fr_developerportal_components_partnerdashboard_deleteconfirm3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Deleteconfirm3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir supprimer cette annonce ?`)
};

const ar_developerportal_components_partnerdashboard_deleteconfirm3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Deleteconfirm3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد حذف هذه القائمة؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to delete this listing?" |
*
* @param {Developerportal_Components_Partnerdashboard_Deleteconfirm3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_deleteconfirm3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Deleteconfirm3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Deleteconfirm3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_deleteconfirm3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_deleteconfirm3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_deleteconfirm3(inputs)
	return ar_developerportal_components_partnerdashboard_deleteconfirm3(inputs)
});
export { developerportal_components_partnerdashboard_deleteconfirm3 as "developerPortal.components.partnerDashboard.deleteConfirm" }