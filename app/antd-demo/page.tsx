"use client";

import { Button, Card, Flex, Input, Space, message, Tag, Progress, Switch, Slider } from "antd";
import { useState } from "react";

export default function AntdDemoPage() {
  const [value, setValue] = useState("");
  const [api, contextHolder] = message.useMessage();
  const [switchValue, setSwitchValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <div className="p-5">
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="Modern Digital Theme Demo" className="shadow-lg">
          <Flex vertical gap={16}>
            <div>
              <h3 className="text-lg font-semibold mb-2">Interactive Components</h3>
              <Space wrap>
                <Input
                  placeholder="Type something..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{ width: 200 }}
                />
                <Button type="primary" onClick={() => api.success("Primary clicked!")}>
                  Primary
                </Button>
                <Button onClick={() => api.info(`You typed: ${value || "(empty)"}`)}>
                  Show Value
                </Button>
                <Button type="dashed" onClick={() => api.warning("Dashed button clicked")}>
                  Dashed
                </Button>
              </Space>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Status & Feedback</h3>
              <Space wrap>
                <Tag color="blue">Modern Blue</Tag>
                <Tag color="purple">Purple Accent</Tag>
                <Tag color="green">Success Green</Tag>
                <Tag color="orange">Warning Orange</Tag>
                <Tag color="red">Error Red</Tag>
              </Space>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Controls</h3>
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <span className="mr-2">Switch:</span>
                  <Switch 
                    checked={switchValue} 
                    onChange={setSwitchValue}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                  />
                </div>
                <div>
                  <span className="mr-2">Slider:</span>
                  <Slider 
                    value={sliderValue} 
                    onChange={setSliderValue}
                    style={{ width: 200 }}
                  />
                  <span className="ml-2">{sliderValue}%</span>
                </div>
                <Progress 
                  percent={sliderValue} 
                  strokeColor={{
                    '0%': '#3b82f6',
                    '100%': '#8b5cf6',
                  }}
                />
              </Space>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Theme Actions</h3>
              <Space wrap>
                <Button 
                  type="primary" 
                  onClick={() => api.success("Success message!")}
                >
                  Success
                </Button>
                <Button 
                  onClick={() => api.info("Info message!")}
                >
                  Info
                </Button>
                <Button 
                  onClick={() => api.warning("Warning message!")}
                >
                  Warning
                </Button>
                <Button 
                  danger 
                  onClick={() => api.error("Error message!")}
                >
                  Error
                </Button>
              </Space>
            </div>
          </Flex>
        </Card>
      </Space>
    </div>
  );
}


