import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export default function EventReminderEmail({
  name,
  eventTitle,
  startsAt,
  addressText,
}: {
  name: string;
  eventTitle: string;
  startsAt: Date;
  addressText: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Reminder: {eventTitle} is today</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ padding: "24px", backgroundColor: "white", margin: "24px auto", maxWidth: 480 }}>
          <Heading as="h2">See you today, {name}.</Heading>
          <Text>
            <strong>{eventTitle}</strong> starts {new Date(startsAt).toUTCString()}.
          </Text>
          <Text>Address: {addressText}</Text>
        </Container>
      </Body>
    </Html>
  );
}
