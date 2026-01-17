# BoostSend200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**credential_uri** | **str** |  | 
**uri** | **str** |  | 
**activity_id** | **str** | Links to the activity lifecycle for this issuance | 
**inbox** | [**BoostSend200ResponseInbox**](BoostSend200ResponseInbox.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_send200_response import BoostSend200Response

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSend200Response from a JSON string
boost_send200_response_instance = BoostSend200Response.from_json(json)
# print the JSON string representation of the object
print(BoostSend200Response.to_json())

# convert the object into a dict
boost_send200_response_dict = boost_send200_response_instance.to_dict()
# create an instance of BoostSend200Response from a dict
boost_send200_response_from_dict = BoostSend200Response.from_dict(boost_send200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


