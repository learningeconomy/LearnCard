# FederationReceiveRequestConfiguration


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**webhook_url** | **str** |  | [optional] 
**expires_in_days** | **float** |  | [optional] 
**federated_from** | **str** |  | 

## Example

```python
from openapi_client.models.federation_receive_request_configuration import FederationReceiveRequestConfiguration

# TODO update the JSON string below
json = "{}"
# create an instance of FederationReceiveRequestConfiguration from a JSON string
federation_receive_request_configuration_instance = FederationReceiveRequestConfiguration.from_json(json)
# print the JSON string representation of the object
print(FederationReceiveRequestConfiguration.to_json())

# convert the object into a dict
federation_receive_request_configuration_dict = federation_receive_request_configuration_instance.to_dict()
# create an instance of FederationReceiveRequestConfiguration from a dict
federation_receive_request_configuration_from_dict = FederationReceiveRequestConfiguration.from_dict(federation_receive_request_configuration_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


