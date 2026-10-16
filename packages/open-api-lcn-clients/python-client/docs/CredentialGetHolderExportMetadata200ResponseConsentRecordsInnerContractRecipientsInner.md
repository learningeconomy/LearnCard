# CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractRecipientsInner

## Properties

| Name                   | Type                                                                                                                    | Description                                                                                 | Notes                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------- |
| **profile_id**         | **str**                                                                                                                 | Unique, URL-safe identifier for the profile.                                                |
| **display_name**       | **str**                                                                                                                 | Human-readable display name for the profile.                                                | [default to '']               |
| **short_bio**          | **str**                                                                                                                 | Short bio for the profile.                                                                  | [default to '']               |
| **image**              | **str**                                                                                                                 | Profile image URL for the profile.                                                          | [optional]                    |
| **hero_image**         | **str**                                                                                                                 | Hero image URL for the profile.                                                             | [optional]                    |
| **type**               | **str**                                                                                                                 | Profile type: e.g. \&quot;person\&quot;, \&quot;organization\&quot;, \&quot;service\&quot;. | [optional]                    |
| **is_service_profile** | **bool**                                                                                                                | Whether the profile is a service profile or not.                                            | [optional] [default to False] |
| **display**            | [**BoostGetBoostRecipients200ResponseInnerToAnyOf1Display**](BoostGetBoostRecipients200ResponseInnerToAnyOf1Display.md) |                                                                                             | [optional]                    |
| **did**                | **str**                                                                                                                 |                                                                                             |

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_consent_records_inner_contract_recipients_inner import CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractRecipientsInner

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractRecipientsInner from a JSON string
credential_get_holder_export_metadata200_response_consent_records_inner_contract_recipients_inner_instance = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractRecipientsInner.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractRecipientsInner.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_consent_records_inner_contract_recipients_inner_dict = credential_get_holder_export_metadata200_response_consent_records_inner_contract_recipients_inner_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractRecipientsInner from a dict
credential_get_holder_export_metadata200_response_consent_records_inner_contract_recipients_inner_from_dict = CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractRecipientsInner.from_dict(credential_get_holder_export_metadata200_response_consent_records_inner_contract_recipients_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
