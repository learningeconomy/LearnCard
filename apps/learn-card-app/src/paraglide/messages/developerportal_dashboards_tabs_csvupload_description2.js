/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Description2Inputs */

const en_developerportal_dashboards_tabs_csvupload_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload a CSV spreadsheet to issue credentials in bulk. Each row represents one credential to send. The CSV must include a recipient column (email, phone, profile ID, or DID).`)
};

const es_developerportal_dashboards_tabs_csvupload_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube un archivo CSV para emitir credenciales en lote. Cada fila representa una credencial para enviar. El CSV debe incluir una columna de destinatario (correo, teléfono, ID de perfil o DID).`)
};

const fr_developerportal_dashboards_tabs_csvupload_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez un fichier CSV pour émettre des credentials en lot. Chaque ligne représente un credential à envoyer. Le CSV doit inclure une colonne destinataire (email, téléphone, ID de profil ou DID).`)
};

const ar_developerportal_dashboards_tabs_csvupload_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتحميل ملف CSV لإصدار بيانات الاعتماد بشكل مجمع. يمثل كل صف بيانات اعتماد لإرسالها. يجب أن يتضمن CSV عمود المستلم (البريد الإلكتروني أو الهاتف أو معرف الملف الشخصي أو DID).`)
};

/**
* | output |
* | --- |
* | "Upload a CSV spreadsheet to issue credentials in bulk. Each row represents one credential to send. The CSV must include a recipient column (email, phone, pro..." |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_description2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_description2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_description2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_description2(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_description2(inputs)
});
export { developerportal_dashboards_tabs_csvupload_description2 as "developerPortal.dashboards.tabs.csvUpload.description" }