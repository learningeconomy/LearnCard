# IntegrationsAssociateIntegrationWithSigningAuthorityRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**endpoint** | **str** |  | 
**name** | **str** |  | 
**did** | **str** |  | 
**is_primary** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.integrations_associate_integration_with_signing_authority_request import IntegrationsAssociateIntegrationWithSigningAuthorityRequest

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsAssociateIntegrationWithSigningAuthorityRequest from a JSON string
integrations_associate_integration_with_signing_authority_request_instance = IntegrationsAssociateIntegrationWithSigningAuthorityRequest.from_json(json)
# print the JSON string representation of the object
print(IntegrationsAssociateIntegrationWithSigningAuthorityRequest.to_json())

# convert the object into a dict
integrations_associate_integration_with_signing_authority_request_dict = integrations_associate_integration_with_signing_authority_request_instance.to_dict()
# create an instance of IntegrationsAssociateIntegrationWithSigningAuthorityRequest from a dict
integrations_associate_integration_with_signing_authority_request_from_dict = IntegrationsAssociateIntegrationWithSigningAuthorityRequest.from_dict(integrations_associate_integration_with_signing_authority_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


