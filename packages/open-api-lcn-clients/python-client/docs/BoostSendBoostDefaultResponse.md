# BoostSendBoostDefaultResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **str** |  | 
**code** | **str** |  | 
**issues** | [**List[BoostSendBoostDefaultResponseIssuesInner]**](BoostSendBoostDefaultResponseIssuesInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_boost_default_response import BoostSendBoostDefaultResponse

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendBoostDefaultResponse from a JSON string
boost_send_boost_default_response_instance = BoostSendBoostDefaultResponse.from_json(json)
# print the JSON string representation of the object
print(BoostSendBoostDefaultResponse.to_json())

# convert the object into a dict
boost_send_boost_default_response_dict = boost_send_boost_default_response_instance.to_dict()
# create an instance of BoostSendBoostDefaultResponse from a dict
boost_send_boost_default_response_from_dict = BoostSendBoostDefaultResponse.from_dict(boost_send_boost_default_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


